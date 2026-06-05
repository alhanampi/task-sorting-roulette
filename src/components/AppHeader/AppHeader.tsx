import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { IAppHeaderProps } from "../../utils/interfaces";
import { languageOptions } from "../../utils/constants";

export default function AppHeader({
  isSignedIn,
  currentUser,
  partner,
  language,
  onLanguageChange,
  onSignOut,
  onSignIn,
  onSignUp,
}: IAppHeaderProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {t("appTitle")}
          </Typography>
          {currentUser && (
            <Typography variant="body2" color="text.secondary">
              {t("hello", { username: currentUser.username })}
              {partner &&
                ` · ${t("linkedWith", { username: partner.username })}`}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <LanguageSwitcher
            language={language}
            onChange={onLanguageChange}
            options={languageOptions}
          />
          {isSignedIn ? (
            <Button variant="outlined" size="small" onClick={onSignOut}>
              {t("logout")}
            </Button>
          ) : (
            <>
              <Button variant="outlined" size="small" onClick={onSignIn}>
                {t("login", "Iniciar sesión")}
              </Button>
              <Button variant="contained" size="small" onClick={onSignUp}>
                {t("createAccount", "Registrarse")}
              </Button>
            </>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
