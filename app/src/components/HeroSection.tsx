import { Box, Container, Typography } from "@mui/material";
import BaseButton from "../shared/components/BaseButton";
import { PALETTE, TOKENS } from "../theme/tokens";

export type HeroImage = {
  src: string;
  alt: string;
};

export type HeroSectionProps = {
  /** Dòng tiêu đề đầu, chữ trắng. */
  title: string;
  /** Cụm từ nhấn màu, nối tiếp sau `title` trên cùng một dòng. */
  highlight?: string;
  /** Dòng tiêu đề thứ hai. */
  subtitle?: string;
  /** Đoạn mô tả nhỏ phía dưới. */
  description?: string;
  /** Nhãn nút hành động; chỉ hiện khi có cả `onAction`. */
  actionLabel?: string;
  onAction?: () => void;
  /** Ảnh minh hoạ xếp dạng masonry bên dưới phần chữ. */
  images?: HeroImage[];
};

export default function HeroSection({
  title,
  highlight,
  subtitle,
  description,
  actionLabel,
  onAction,
  images,
}: HeroSectionProps) {
  const hasImages = !!images && images.length > 0;

  return (
    <Box
      component="section"
      sx={{ color: TOKENS.textPrimary, py: { xs: 3, md: 6 }, px: 2 }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            alignItems: "center",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: {
              xs: "1fr",
              md: hasImages ? "minmax(0, 5fr) minmax(0, 6fr)" : "1fr",
            },
            textAlign: { xs: "center", md: hasImages ? "left" : "center" },
          }}
        >
          <Box>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: 30, sm: 38, md: 48 },
                lineHeight: 1.15,
              }}
            >
              {title}
              {highlight && (
                <>
                  {" "}
                  <Box component="span" sx={{ color: PALETTE.lacquer }}>
                    {highlight}
                  </Box>
                </>
              )}
              {subtitle && (
                <>
                  <br />
                  {subtitle}
                </>
              )}
            </Typography>
            {description && (
              <Typography
                sx={{
                  mt: 2,
                  maxWidth: 520,
                  mx: { xs: "auto", md: hasImages ? 0 : "auto" },
                  fontSize: { xs: 14, md: 16 },
                  lineHeight: 1.7,
                  color: TOKENS.textSecondary,
                }}
              >
                {description}
              </Typography>
            )}
            {actionLabel && onAction && (
              <BaseButton
                variant="contained"
                size="large"
                onClick={onAction}
                sx={{ mt: 3 }}
              >
                {actionLabel}
              </BaseButton>
            )}
          </Box>
          {hasImages && (
            <Box
              sx={{
                p: { xs: 1.5, md: 2 },
                borderRadius: 4,
                bgcolor: "#F4F6FF",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                {images.map(({ src, alt }, index) => {
                  // ảnh cuối (bản đồ cả nước) chiếm trọn cột phải
                  const featured = index === images.length - 1;
                  return (
                    <Box
                      key={src}
                      component="img"
                      src={src}
                      alt={alt}
                      loading="lazy"
                      sx={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        // hoà nền ảnh vào nền khung, không còn viền hộp
                        mixBlendMode: "multiply",
                        gridColumn: featured ? 2 : 1,
                        gridRow: featured
                          ? `1 / span ${images.length - 1}`
                          : "auto",
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
}
