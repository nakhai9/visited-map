import { Box, Container, Typography } from "@mui/material";
import { PALETTE, TOKENS } from "../theme/tokens";
import BaseButton from "../shared/components/BaseButton";

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
};

export default function HeroSection({
  title,
  highlight,
  subtitle,
  description,
  actionLabel,
  onAction,
}: HeroSectionProps) {
  return (
    <Box
      component="section"
      sx={{
        color: TOKENS.textPrimary,
        textAlign: "center",
        py: { xs: 3, md: 5 },
        px: 2,
      }}
    >
      <Container maxWidth="md">
        <Typography
          variant="h2"
          component="h1"
          sx={{
            fontWeight: 700,
            fontSize: { xs: 28, sm: 36, md: 44 },
            lineHeight: 1.2,
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
              mx: "auto",
              maxWidth: 640,
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
      </Container>
    </Box>
  );
}
