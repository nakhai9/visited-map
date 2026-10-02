const sequelize = require("../../configs/databaseConfig");
const { Scrapbook, ScrapbookLocation } = require("../../models/associations");
const Response = require("../../utils/handleError");
const Utils = require("../../utils/uploadUtils");

const HEX_COLOR = /^#[0-9a-f]{6}([0-9a-f]{2})?$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const THUMB_PREFIX = "thumb_";
// Các cài đặt hiển thị lưu theo scrapbook (cột boolean trong bảng scrapbooks).
const SETTING_KEYS = ["showLabel", "showStats", "enableZoom", "enablePan"];

const toResponse = (scrapbook) => ({
    id: scrapbook.id,
    locationCode: scrapbook.locationCode,
    title: scrapbook.title,
    showLabel: scrapbook.showLabel,
    showStats: scrapbook.showStats,
    enableZoom: scrapbook.enableZoom,
    enablePan: scrapbook.enablePan,
    visitedStates: (scrapbook.locations ?? []).map((l) => ({
        codename: l.codename,
        name: l.name,
        visitedAt: l.visitedAt,
        areaStyle: {
            areaColor: l.areaColor,
            areaBackground: l.areaBackgroundUrl,
        },
    })),
});

const findScrapbook = (where) =>
    Scrapbook.findOne({
        where,
        include: [{ model: ScrapbookLocation, as: "locations" }],
        order: [[{ model: ScrapbookLocation, as: "locations" }, "visited_at", "ASC"]],
    });

// GET /api/scrapbooks?locationCode=vn34 -> scrapbook của user hiện tại (data = null nếu chưa có).
const getMyScrapbook = async (req, res) => {
    try {
        const { locationCode } = req.query;
        if (!locationCode) {
            return res.status(400).json(Response({ success: false, message: "Thiếu locationCode" }));
        }

        const scrapbook = await findScrapbook({ userId: req.user.id, locationCode });
        return res.status(200).json(Response({ success: true, data: scrapbook ? toResponse(scrapbook) : null }));
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

// Kiểm tra payload và trả về object đã parse; ném Error có status 400 nếu sai.
const parsePayload = (raw) => {
    const fail = (message) => Object.assign(new Error(message), { status: 400 });

    let payload;
    try {
        payload = JSON.parse(raw);
    } catch {
        throw fail("payload không phải JSON hợp lệ");
    }
    if (!payload.locationCode) throw fail("Thiếu locationCode");
    if (!Array.isArray(payload.visitedStates)) throw fail("visitedStates phải là mảng");

    const seen = new Set();
    for (const s of payload.visitedStates) {
        if (!s.codename || !s.name) throw fail("Mỗi địa điểm cần codename và name");
        if (seen.has(s.codename)) throw fail(`Trùng codename: ${s.codename}`);
        seen.add(s.codename);
        if (!DATE_ONLY.test(s.visitedAt ?? "")) throw fail(`visitedAt của ${s.codename} phải có dạng YYYY-MM-DD`);
        const { areaColor, areaBackground } = s.areaStyle ?? {};
        if (areaColor && !HEX_COLOR.test(areaColor)) throw fail(`areaColor của ${s.codename} không phải mã hex`);
        if (Boolean(areaColor) === Boolean(areaBackground)) {
            throw fail(`${s.codename}: chỉ được có một trong areaColor hoặc areaBackground`);
        }
    }
    return payload;
};

// POST /api/scrapbooks (multipart/form-data)
//   payload: JSON { locationCode, title?, settings: { showLabel, showStats, enableZoom, enablePan }, visitedStates: [...] }
//   thumb_<codename>: file ảnh thumbnail của địa điểm đó (chỉ gửi khi mới chọn/đổi ảnh)
// areaStyle.areaBackground: nếu có file thumb_<codename> thì upload ảnh mới; nếu là URL đã lưu thì giữ nguyên.
// Gọi lại sẽ thay toàn bộ danh sách địa điểm của scrapbook (upsert theo user + locationCode).
const saveScrapbook = async (req, res) => {
    const uploadedIds = []; // ảnh vừa upload, xoá lại nếu ghi DB lỗi
    try {
        let payload;
        try {
            payload = parsePayload(req.body.payload);
        } catch (error) {
            return res.status(error.status ?? 400).json(Response({ success: false, message: error.message }));
        }

        const files = new Map((req.files ?? []).map((f) => [f.fieldname, f]));
        const userId = req.user.id;
        const { locationCode } = payload;

        const existing = await findScrapbook({ userId, locationCode });
        const oldByCodename = new Map((existing?.locations ?? []).map((l) => [l.codename, l]));

        // Upload ảnh mới trước khi mở transaction để không giữ transaction trong lúc chờ Cloudinary.
        const rows = [];
        for (const s of payload.visitedStates) {
            const old = oldByCodename.get(s.codename);
            const { areaColor, areaBackground } = s.areaStyle;
            const row = {
                codename: s.codename,
                name: s.name,
                visitedAt: s.visitedAt,
                areaColor: null,
                areaBackgroundUrl: null,
                areaBackgroundPublicId: null,
            };
            const file = files.get(`${THUMB_PREFIX}${s.codename}`);

            if (areaColor) {
                row.areaColor = areaColor;
            } else if (file) {
                const result = await Utils.file.handleUploadToCloudinary(file, {
                    public_id: `scrapbooks/${userId}/${locationCode}/${s.codename}`,
                    overwrite: true,
                    invalidate: true,
                });
                uploadedIds.push(result.public_id);
                row.areaBackgroundUrl = result.secure_url;
                row.areaBackgroundPublicId = result.public_id;
            } else if (old && old.areaBackgroundUrl === areaBackground) {
                row.areaBackgroundUrl = old.areaBackgroundUrl;
                row.areaBackgroundPublicId = old.areaBackgroundPublicId;
            } else {
                return res
                    .status(400)
                    .json(Response({ success: false, message: `${s.codename}: thiếu file ${THUMB_PREFIX}${s.codename}` }));
            }
            rows.push(row);
        }

        const settings = payload.settings ?? {};
        const scrapbook = await sequelize.transaction(async (transaction) => {
            const values = {
                title: payload.title ?? null,
                ...Object.fromEntries(SETTING_KEYS.map((key) => [key, Boolean(settings[key])])),
            };
            const target = existing
                ? await existing.update(values, { transaction })
                : await Scrapbook.create({ userId, locationCode, ...values }, { transaction });

            await ScrapbookLocation.destroy({ where: { scrapbookId: target.id }, transaction });
            await ScrapbookLocation.bulkCreate(
                rows.map((r) => ({ ...r, scrapbookId: target.id })),
                { transaction, validate: true }
            );
            return target;
        });

        // Dọn ảnh không còn dùng (địa điểm bị bỏ, hoặc đổi từ ảnh sang màu). Không ảnh hưởng kết quả trả về.
        const keptIds = new Set(rows.map((r) => r.areaBackgroundPublicId).filter(Boolean));
        const orphanIds = [...oldByCodename.values()]
            .map((l) => l.areaBackgroundPublicId)
            .filter((id) => id && !keptIds.has(id));
        await Promise.all(orphanIds.map(Utils.file.handleDeleteFromCloudinary));

        const saved = await findScrapbook({ id: scrapbook.id });
        return res.status(200).json(Response({ success: true, data: toResponse(saved) }));
    } catch (error) {
        await Promise.all(uploadedIds.map(Utils.file.handleDeleteFromCloudinary));
        return res.status(500).json({ message: "Lưu scrapbook thất bại", error: error.message });
    }
};

// PATCH /api/scrapbooks/settings (JSON) { locationCode, settings: { showLabel?, showStats?, enableZoom?, enablePan? } }
// Chỉ cập nhật các cài đặt được gửi, không đụng tới danh sách địa điểm; chưa có scrapbook thì tạo mới (rỗng).
const updateMyScrapbookSettings = async (req, res) => {
    try {
        const { locationCode, settings } = req.body ?? {};
        if (!locationCode) {
            return res.status(400).json(Response({ success: false, message: "Thiếu locationCode" }));
        }
        const values = Object.fromEntries(
            SETTING_KEYS.filter((key) => typeof settings?.[key] === "boolean").map((key) => [key, settings[key]])
        );
        if (!Object.keys(values).length) {
            return res
                .status(400)
                .json(Response({ success: false, message: `settings cần ít nhất một trong: ${SETTING_KEYS.join(", ")}` }));
        }

        const userId = req.user.id;
        const [scrapbook, created] = await Scrapbook.findOrCreate({
            where: { userId, locationCode },
            defaults: values,
        });
        if (!created) await scrapbook.update(values);

        const saved = await findScrapbook({ id: scrapbook.id });
        return res.status(200).json(Response({ success: true, data: toResponse(saved) }));
    } catch (error) {
        return res.status(500).json({ message: "Lưu cài đặt thất bại", error: error.message });
    }
};

// DELETE /api/scrapbooks/:id -> chỉ chủ sở hữu mới xoá được.
const deleteScrapbook = async (req, res) => {
    try {
        const scrapbook = await findScrapbook({ id: req.params.id, userId: req.user.id });
        if (!scrapbook) {
            return res.status(404).json(Response({ success: false, message: "Scrapbook not found" }));
        }

        const publicIds = scrapbook.locations.map((l) => l.areaBackgroundPublicId).filter(Boolean);
        await scrapbook.destroy();
        await Promise.all(publicIds.map(Utils.file.handleDeleteFromCloudinary));

        return res.status(200).json(Response({ success: true }));
    } catch (error) {
        return res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
};

module.exports = { getMyScrapbook, saveScrapbook, updateMyScrapbookSettings, deleteScrapbook };
