import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { sendPartnerRequest } from "../../db/queries";
import { IPartnerSectionProps } from "../../utils/interfaces";

type Step = "form" | "sent" | "error";

export default function PartnerSection({
  soloMode,
  onSoloModeChange,
  partner,
  currentUserEmail,
  onRequestSent,
}: IPartnerSectionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [errorKey, setErrorKey] = useState("");
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setOpen(false);
    setEmail("");
    setStep("form");
    setErrorKey("");
  }

  async function handleSend() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await sendPartnerRequest(currentUserEmail, email.trim());
      setStep("sent");
      onRequestSent(email.trim());
    } catch (err: unknown) {
      const body = err instanceof Error ? err.message : "";
      if (body.includes("toUserNotFound")) setErrorKey("noUserFound");
      else if (body.includes("requestAlreadyExists")) setErrorKey("requestAlreadyExists");
      else if (body.includes("cannotLinkSelf")) setErrorKey("cannotLinkSelf");
      else setErrorKey("genericError");
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1" fontWeight="bold">
          {t("modeLabel", "Modo")}
        </Typography>
        <ToggleButtonGroup
          value={soloMode ? "solo" : "partner"}
          exclusive
          size="small"
          onChange={(_, v) => v !== null && onSoloModeChange(v === "solo")}
        >
          <ToggleButton value="solo">{t("modeIndividual")}</ToggleButton>
          <ToggleButton value="partner">{t("modePartner")}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {!soloMode && (
        partner ? (
          <Alert severity="success">
            {t("linkedNotice", { username: partner.username })}
          </Alert>
        ) : (
          <Button variant="outlined" fullWidth onClick={() => setOpen(true)}>
            {t("invitePartner", "Invitar compañero")}
          </Button>
        )
      )}

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle>{t("invitePartnerTitle", "Invitar compañero")}</DialogTitle>
        <DialogContent>
          {step === "form" && (
            <Stack spacing={2} mt={1}>
              <Typography variant="body2" color="text.secondary">
                {t("invitePartnerDesc", "Ingresa el email de la cuenta de tu compañero. Recibirá una invitación y deberá aceptarla.")}
              </Typography>
              <TextField
                label={t("linkLabel")}
                type="email"
                size="small"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("linkPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={loading}
              />
            </Stack>
          )}
          {step === "sent" && (
            <Alert severity="success" sx={{ mt: 1 }}>
              {t("requestSent", { email })}
            </Alert>
          )}
          {step === "error" && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {t(errorKey, errorKey)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          {step === "form" && (
            <>
              <Button onClick={handleClose} disabled={loading}>
                {t("cancel", "Cancelar")}
              </Button>
              <Button
                variant="contained"
                onClick={handleSend}
                disabled={loading || !email.trim()}
                startIcon={loading ? <CircularProgress size={16} /> : null}
              >
                {t("sendInvite", "Enviar invitación")}
              </Button>
            </>
          )}
          {(step === "sent" || step === "error") && (
            <>
              {step === "error" && (
                <Button onClick={() => setStep("form")}>{t("retry", "Reintentar")}</Button>
              )}
              <Button variant="contained" onClick={handleClose}>
                {t("close", "Cerrar")}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
