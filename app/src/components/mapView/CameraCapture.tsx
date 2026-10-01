import { Box, Stack, Typography } from "@mui/material";
import { Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BaseButton from "../../shared/components/BaseButton";
import { fileToThumbnail } from "./thumbnail";

type CameraCaptureProps = {
  /** Gọi với data URL (JPEG) của khung hình vừa chụp. */
  onCapture: (dataUrl: string) => void;
};

const CAPTURE_MAX_SIZE = 512;

/** Mở camera, xem trước trực tiếp và chụp một khung hình làm thumbnail. */
export default function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const fallbackInputRef = useRef<HTMLInputElement>(null);

  // Bật camera khi mount, tắt hẳn (dừng mọi track) khi unmount để đèn camera tắt.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("unsupported");
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setReady(true);
      } catch (e) {
        if (cancelled) return;
        setError(
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Bạn chưa cho phép truy cập camera"
            : "Không thể mở camera trên thiết bị này",
        );
      }
    })();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const scale = Math.min(
      1,
      CAPTURE_MAX_SIZE / Math.max(video.videoWidth, video.videoHeight),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas
      .getContext("2d")
      ?.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
  };

  // Không mở được camera trực tiếp (trang không phải HTTPS, bị từ chối quyền, webview...):
  // dùng ô chọn file có `capture` để mở app camera của máy. Trên mobile đây là app camera
  // gốc; trên laptop trình duyệt sẽ mở hộp thoại chọn file.
  if (error) {
    return (
      <Stack spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="caption" color="error">
          {error}
        </Typography>
        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              onCapture(await fileToThumbnail(file));
            } catch (err) {
              console.error(err);
              setError("Không thể đọc ảnh vừa chụp");
            }
          }}
        />
        <BaseButton
          variant="outlined"
          size="small"
          startIcon={<Camera size={16} />}
          onClick={() => fallbackInputRef.current?.click()}
        >
          Chụp bằng app camera
        </BaseButton>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ alignItems: "center" }}>
      <Box
        component="video"
        ref={videoRef}
        muted
        playsInline
        sx={{
          width: "100%",
          maxHeight: 280,
          borderRadius: 1,
          bgcolor: "#000000",
          objectFit: "cover",
        }}
      />
      <BaseButton
        variant="contained"
        size="small"
        startIcon={<Camera size={16} />}
        disabled={!ready}
        sx={{ color: "#ffffff !important", bgcolor: "#222222 !important" }}
        onClick={handleCapture}
      >
        Chụp
      </BaseButton>
    </Stack>
  );
}
