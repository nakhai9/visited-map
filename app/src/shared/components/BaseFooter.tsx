import { Box, Container, Typography } from "@mui/material";
import { TOKENS } from "../../theme/tokens";

export default function BaseFooter() {
  return (
    <Box
      component="footer"
      sx={{ py: 2, borderTop: "1px solid", borderColor: TOKENS.border }}
    >
      <Container maxWidth="lg">
        <Typography
          sx={{
            textAlign: "center",
            fontSize: 13,
            color: TOKENS.textSecondary,
          }}
        >
          © 2026 Vietnam Adventures
        </Typography>
      </Container>
    </Box>
  );
}
