import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { useModal } from "./modal";

export default function BaseModal() {
  const modals = useModal((s) => s.modals);
  const hideModal = useModal((s) => s.hideModal);

  return (
    <>
      {modals.map((modal) => {
        const handleClose = (_event: unknown, reason?: string) => {
          if (
            modal.disableClose &&
            (reason === "backdropClick" || reason === "escapeKeyDown")
          ) {
            return;
          }
          hideModal(modal.id);
        };

        return (
          <Dialog
            key={modal.id}
            open
            onClose={handleClose}
            maxWidth={modal.maxWidth ?? "sm"}
            fullWidth={modal.fullWidth ?? true}
          >
            {modal.title && (
              <DialogTitle
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pr: 6,
                  bgcolor: "#f8fafc",
                }}
              >
                {modal.title}
                {!modal.disableClose && (
                  <IconButton
                    onClick={() => hideModal(modal.id)}
                    sx={{ position: "absolute", right: 8, top: 8 }}
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </DialogTitle>
            )}

            {modal.content && (
              <DialogContent dividers>{modal.content}</DialogContent>
            )}

            {modal.actions && (
              <DialogActions sx={{ px: 2, py: 3, width: "100%" }}>
                {modal.actions}
              </DialogActions>
            )}
          </Dialog>
        );
      })}
    </>
  );
}
