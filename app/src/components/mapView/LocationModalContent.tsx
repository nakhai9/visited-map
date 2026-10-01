import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import {
  Box,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";
import BaseButton from "../../shared/components/BaseButton";
import { VISITED_COLORS, type LocationStyle } from "./constants";

type LocationModalContentProps = {
  initialVisited: boolean;
  initialStyle: LocationStyle;
  /** Thời điểm ghé thăm đã lưu (ISO 8601), bỏ trống thì mặc định hôm nay. */
  initialVisitedAt?: string;
  /** Hiện ô chọn thời gian ghé thăm (chỉ khi đã đăng nhập). */
  showVisitedAt?: boolean;
  /** `visitedAt` trả về dạng ISO 8601. */
  onSubmit: (visited: boolean, style: LocationStyle, visitedAt: string) => void;
  onCancel: () => void;
};

/** ISO 8601 -> "YYYY-MM-DD" theo giờ địa phương (giá trị của <input type="date">). */
const toDateInput = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const THUMBNAIL_MAX_SIZE = 512;
const MAX_FILE_SIZE_MB = 5;

/** Đọc file ảnh, thu nhỏ về tối đa THUMBNAIL_MAX_SIZE rồi trả về data URL. */
const fileToThumbnail = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(
          1,
          THUMBNAIL_MAX_SIZE / Math.max(img.width, img.height),
        );
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

/** Nội dung modal khi click một tỉnh: đã đến + chọn màu hoặc thumbnail. */
export default function LocationModalContent({
  initialVisited,
  initialStyle,
  initialVisitedAt,
  showVisitedAt = true,
  onSubmit,
  onCancel,
}: LocationModalContentProps) {
  const [style, setStyle] = useState<LocationStyle>(initialStyle);
  const [visitedDate, setVisitedDate] = useState(toDateInput(initialVisitedAt));
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Chỉ hỗ trợ file hình ảnh");
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Dung lượng tối đa ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setError("");
    try {
      const thumbnail = await fileToThumbnail(file);
      setStyle((prev) => ({ ...prev, thumbnail }));
    } catch (error) {
      console.error(error);
    }
  };

  const submit = (visited: boolean) =>
    onSubmit(
      visited,
      style,
      new Date(`${visitedDate || toDateInput()}T00:00:00`).toISOString(),
    );

  return (
    <Stack spacing={2}>
      {showVisitedAt && (
        <TextField
          type="date"
          size="small"
          label="Thời gian ghé thăm"
          value={visitedDate}
          onChange={(e) => setVisitedDate(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { max: toDateInput() },
          }}
        />
      )}
      <>
        <FormLabel
          sx={{
            color: "#111111",
            fontWeight: 600,
            "&.Mui-focused": { color: "#111111" },
          }}
        >
          Nền
        </FormLabel>
        <RadioGroup
          row
          value={style.mode}
          onChange={(e) =>
            setStyle((prev) => ({
              ...prev,
              mode: e.target.value as LocationStyle["mode"],
            }))
          }
        >
          <FormControlLabel value="color" control={<Radio />} label="Màu" />
          <FormControlLabel
            value="thumbnail"
            control={<Radio />}
            label="Thumbnail"
          />
        </RadioGroup>

        {style.mode === "color" && (
          <Stack direction="row" spacing={1.5}>
            {VISITED_COLORS.map((color) => {
              const selected = style.color === color;
              return (
                <Box
                  key={color}
                  component="button"
                  type="button"
                  aria-label={color}
                  title={color}
                  onClick={() => setStyle((prev) => ({ ...prev, color }))}
                  sx={{
                    width: 32,
                    height: 32,
                    p: 0,
                    borderRadius: "50%",
                    bgcolor: color,
                    border: "2px solid #ffffff",
                    outline: "2px solid",
                    outlineColor: selected ? color : "transparent",
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </Stack>
        )}

        {style.mode === "thumbnail" && (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              p: 3,
              border: "1px dashed",
              borderColor: isDragging ? "primary.main" : "#cbd5e1",
              borderRadius: 1,
              bgcolor: isDragging ? "#f4f4fd" : "#ffffff",
              textAlign: "center",
            }}
          >
            {style.thumbnail ? (
              <Box
                component="img"
                src={style.thumbnail}
                alt="Thumbnail"
                sx={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            ) : (
              <InsertDriveFileOutlinedIcon sx={{ color: "#94a3b8" }} />
            )}
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
              Kéo và thả file vào đây
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hỗ trợ: PNG, JPG, WEBP
            </Typography>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <BaseButton
              variant="contained"
              size="small"
              sx={{
                color: "#334155 !important",
                bgcolor: "#e2e8f0 !important",
              }}
              onClick={() => inputRef.current?.click()}
            >
              {style.thumbnail ? "Đổi ảnh" : "Chọn file"}
            </BaseButton>
            <Typography
              variant="caption"
              color={error ? "error" : "text.secondary"}
            >
              {error || `Dung lượng tối đa ${MAX_FILE_SIZE_MB}MB`}
            </Typography>
          </Box>
        )}
      </>

      <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
        <BaseButton variant="outlined" color="secondary" onClick={onCancel}>
          Hủy
        </BaseButton>
        {initialVisited && (
          <BaseButton
            variant="outlined"
            color="error"
            onClick={() => submit(false)}
          >
            Bỏ đã đến
          </BaseButton>
        )}
        <BaseButton
          variant="contained"
          sx={{ color: "#ffffff !important", bgcolor: "#222222 !important" }}
          onClick={() => submit(true)}
        >
          Đã đến
        </BaseButton>
      </Stack>
    </Stack>
  );
}
