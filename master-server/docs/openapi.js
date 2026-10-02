// Đặc tả OpenAPI 3.0 cho toàn bộ API, hiển thị bằng Swagger UI tại /api-docs (xem server.js).
// Thêm/sửa route thì cập nhật ở đây cho khớp. operationId trùng tên handler trong controllers;
// `security: []` = API công khai, không cần token.

const errorResponse = (description) => ({
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
});

const serverErrorResponse = {
    description: "Lỗi hệ thống",
    content: { "application/json": { schema: { $ref: "#/components/schemas/ServerError" } } },
};

// Envelope `{ success, code, data, message }` của utils/handleError.js với `data` theo schema truyền vào.
const envelope = (dataSchema) => ({
    allOf: [
        { $ref: "#/components/schemas/ApiResponse" },
        { type: "object", properties: { data: dataSchema } },
    ],
});

const ok = (description, dataSchema) => ({
    description,
    content: { "application/json": { schema: envelope(dataSchema) } },
});

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });

module.exports = {
    openapi: "3.0.3",
    info: {
        title: "Visited Map API",
        version: "1.0.0",
        description:
            "API cho ứng dụng Visited Map: đăng nhập Google (Firebase), quản lý scrapbook bản đồ đã đến và upload ảnh.\n\n" +
            "Các API cần đăng nhập nhận Firebase ID token ở header `Authorization: Bearer <idToken>` " +
            "(bấm **Authorize** để nhập token).",
    },
    servers: [{ url: "/", description: "Server hiện tại" }],
    tags: [
        { name: "Health", description: "Kiểm tra server" },
        { name: "Auth", description: "Đăng nhập" },
        { name: "Users", description: "Người dùng" },
        { name: "Scrapbooks", description: "Scrapbook của user đang đăng nhập (cần token)" },
        { name: "Upload", description: "Upload ảnh lên Cloudinary" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "Firebase ID token",
                description: "Firebase ID token lấy từ `auth.currentUser.getIdToken()` ở client.",
            },
        },
        schemas: {
            ApiResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean" },
                    code: { type: "string", nullable: true },
                    message: { type: "string", nullable: true },
                    data: { description: "Dữ liệu trả về, kiểu tuỳ theo API" },
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                },
            },
            ServerError: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Lỗi hệ thống" },
                    error: { type: "string", description: "Chi tiết lỗi" },
                },
            },
            User: {
                type: "object",
                properties: {
                    id: { type: "integer", example: 1 },
                    firebaseUid: { type: "string", nullable: true },
                    email: { type: "string", format: "email" },
                    name: { type: "string", nullable: true },
                    avatar: { type: "string", nullable: true, description: "URL ảnh đại diện" },
                    firstName: { type: "string", nullable: true },
                    lastName: { type: "string", nullable: true },
                    fullName: { type: "string", nullable: true },
                    phoneNumber: { type: "string", nullable: true },
                    created_at: { type: "string", format: "date-time" },
                },
            },
            CreateUserInput: {
                type: "object",
                required: ["firstName", "lastName", "phoneNumber", "email", "fullName"],
                properties: {
                    firstName: { type: "string", example: "An" },
                    lastName: { type: "string", example: "Nguyễn" },
                    fullName: { type: "string", example: "Nguyễn An" },
                    phoneNumber: { type: "string", example: "0901234567" },
                    email: { type: "string", format: "email", example: "an@example.com" },
                },
            },
            ScrapbookSettings: {
                type: "object",
                properties: {
                    showLabel: { type: "boolean", description: "Hiện tên tỉnh/thành phố" },
                    showStats: { type: "boolean", description: "Hiện thống kê" },
                    enableZoom: { type: "boolean", description: "Cho phép zoom" },
                    enablePan: { type: "boolean", description: "Cho phép pan (kéo bản đồ)" },
                },
            },
            AreaStyle: {
                type: "object",
                description: "Chỉ một trong `areaColor` hoặc `areaBackground` có giá trị.",
                properties: {
                    areaColor: { type: "string", nullable: true, example: "#AA210F", description: "Mã hex 6 hoặc 8 ký tự" },
                    areaBackground: { type: "string", nullable: true, description: "URL ảnh thumbnail đã lưu" },
                },
            },
            VisitedState: {
                type: "object",
                required: ["codename", "name", "visitedAt", "areaStyle"],
                properties: {
                    codename: { type: "string", example: "ha_noi" },
                    name: { type: "string", example: "Hà Nội" },
                    visitedAt: { type: "string", format: "date", example: "2026-10-02" },
                    areaStyle: ref("AreaStyle"),
                },
            },
            Scrapbook: {
                allOf: [
                    {
                        type: "object",
                        properties: {
                            id: { type: "integer", example: 1 },
                            locationCode: { type: "string", example: "vn34" },
                            title: { type: "string", nullable: true },
                        },
                    },
                    ref("ScrapbookSettings"),
                    {
                        type: "object",
                        properties: {
                            visitedStates: { type: "array", items: ref("VisitedState") },
                        },
                    },
                ],
            },
            SaveScrapbookPayload: {
                type: "object",
                required: ["locationCode", "visitedStates"],
                properties: {
                    locationCode: { type: "string", example: "vn34" },
                    title: { type: "string", nullable: true },
                    settings: ref("ScrapbookSettings"),
                    visitedStates: {
                        type: "array",
                        description:
                            "Thay toàn bộ danh sách địa điểm. `areaStyle.areaBackground`: `__file__` nếu gửi kèm file " +
                            "`thumb_<codename>`, hoặc URL đã lưu để giữ nguyên ảnh cũ.",
                        items: ref("VisitedState"),
                    },
                },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                operationId: "checkHealth",
                security: [],
                tags: ["Health"],
                summary: "Kiểm tra server còn sống",
                responses: {
                    200: {
                        description: "Server đang chạy",
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { message: { type: "string", example: "I'm fine" } } },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/google": {
            post: {
                operationId: "authWithGoogle",
                security: [],
                tags: ["Auth"],
                summary: "Đăng nhập bằng Google",
                description: "Xác thực Firebase ID token; tạo user mới nếu chưa có.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["idToken"],
                                properties: { idToken: { type: "string", description: "Firebase ID token" } },
                            },
                        },
                    },
                },
                responses: {
                    200: ok("Đăng nhập thành công", ref("User")),
                    400: {
                        description: "Thiếu idToken",
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { message: { type: "string", example: "Id token not existing" } } },
                            },
                        },
                    },
                    500: serverErrorResponse,
                },
            },
        },
        "/api/users": {
            get: {
                operationId: "getUsers",
                security: [],
                tags: ["Users"],
                summary: "Danh sách user",
                responses: {
                    200: ok("Danh sách user", { type: "array", items: ref("User") }),
                    500: serverErrorResponse,
                },
            },
            post: {
                operationId: "createUser",
                security: [],
                tags: ["Users"],
                summary: "Tạo user",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: ref("CreateUserInput") } },
                },
                responses: {
                    201: ok("Tạo thành công", ref("User")),
                    400: {
                        description: "Thiếu thông tin bắt buộc",
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { message: { type: "string" } } },
                            },
                        },
                    },
                    409: errorResponse("Email đã tồn tại"),
                    500: serverErrorResponse,
                },
            },
        },
        "/api/users/{id}": {
            get: {
                operationId: "getUserById",
                security: [],
                tags: ["Users"],
                summary: "Lấy user theo id",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: {
                    200: ok("Thông tin user", ref("User")),
                    404: errorResponse("Không tìm thấy user"),
                    500: serverErrorResponse,
                },
            },
        },
        "/api/scrapbooks": {
            get: {
                operationId: "getMyScrapbook",
                tags: ["Scrapbooks"],
                summary: "Lấy scrapbook của user hiện tại cho một bản đồ",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "locationCode",
                        in: "query",
                        required: true,
                        schema: { type: "string", example: "vn34" },
                    },
                ],
                responses: {
                    200: ok("Scrapbook, hoặc `data: null` nếu chưa có", { type: "object", allOf: [ref("Scrapbook")], nullable: true }),
                    400: errorResponse("Thiếu locationCode"),
                    401: errorResponse("Chưa đăng nhập / token không hợp lệ"),
                    500: serverErrorResponse,
                },
            },
            post: {
                operationId: "saveScrapbook",
                tags: ["Scrapbooks"],
                summary: "Lưu scrapbook (upsert theo user + locationCode)",
                description:
                    "Thay toàn bộ danh sách địa điểm và cài đặt của scrapbook.\n\n" +
                    "- `payload`: chuỗi JSON theo schema `SaveScrapbookPayload`.\n" +
                    "- `thumb_<codename>`: file ảnh thumbnail cho địa điểm có `areaBackground = \"__file__\"` " +
                    "(tối đa 5MB/file, chỉ nhận ảnh). Tên field thay đổi theo codename nên Swagger UI không có ô chọn file; " +
                    "thử trực tiếp ở đây được với các địa điểm dùng `areaColor`.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["payload"],
                                properties: {
                                    payload: {
                                        type: "string",
                                        description: "JSON của SaveScrapbookPayload",
                                        example: JSON.stringify({
                                            locationCode: "vn34",
                                            settings: { showLabel: true, showStats: false, enableZoom: true, enablePan: true },
                                            visitedStates: [
                                                {
                                                    codename: "ha_noi",
                                                    name: "Hà Nội",
                                                    visitedAt: "2026-10-02",
                                                    areaStyle: { areaColor: "#AA210F", areaBackground: null },
                                                },
                                            ],
                                        }),
                                    },
                                },
                                additionalProperties: {
                                    type: "string",
                                    format: "binary",
                                    description: "File `thumb_<codename>`",
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: ok("Scrapbook sau khi lưu", ref("Scrapbook")),
                    400: errorResponse("Payload sai, thiếu file thumbnail, hoặc file không hợp lệ"),
                    401: errorResponse("Chưa đăng nhập / token không hợp lệ"),
                    500: serverErrorResponse,
                },
            },
        },
        "/api/scrapbooks/settings": {
            patch: {
                operationId: "updateMyScrapbookSettings",
                tags: ["Scrapbooks"],
                summary: "Chỉ cập nhật cài đặt của scrapbook",
                description:
                    "Chỉ cập nhật các cài đặt được gửi (giá trị boolean), không đụng tới danh sách địa điểm. " +
                    "Chưa có scrapbook thì tạo mới (rỗng).",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["locationCode", "settings"],
                                properties: {
                                    locationCode: { type: "string", example: "vn34" },
                                    settings: ref("ScrapbookSettings"),
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: ok("Scrapbook sau khi cập nhật", ref("Scrapbook")),
                    400: errorResponse("Thiếu locationCode hoặc không có cài đặt hợp lệ"),
                    401: errorResponse("Chưa đăng nhập / token không hợp lệ"),
                    500: serverErrorResponse,
                },
            },
        },
        "/api/scrapbooks/{id}": {
            delete: {
                operationId: "deleteScrapbook",
                tags: ["Scrapbooks"],
                summary: "Xoá scrapbook (chỉ chủ sở hữu)",
                description: "Xoá scrapbook, các địa điểm và ảnh thumbnail trên Cloudinary.",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: {
                    200: {
                        description: "Đã xoá",
                        content: { "application/json": { schema: ref("ApiResponse") } },
                    },
                    401: errorResponse("Chưa đăng nhập / token không hợp lệ"),
                    404: errorResponse("Không tìm thấy scrapbook của user"),
                    500: serverErrorResponse,
                },
            },
        },
        "/api/upload": {
            post: {
                operationId: "uploadFile",
                security: [],
                tags: ["Upload"],
                summary: "Upload một file lên Cloudinary",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["file"],
                                properties: { file: { type: "string", format: "binary" } },
                            },
                        },
                    },
                },
                responses: {
                    200: ok("Upload thành công", {
                        type: "object",
                        properties: {
                            url: { type: "string", description: "secure_url trên Cloudinary" },
                            public_id: { type: "string" },
                        },
                    }),
                    400: {
                        description: "Không có file",
                        content: {
                            "application/json": {
                                schema: { type: "object", properties: { message: { type: "string", example: "No file uploaded" } } },
                            },
                        },
                    },
                    500: serverErrorResponse,
                },
            },
        },
    },
};
