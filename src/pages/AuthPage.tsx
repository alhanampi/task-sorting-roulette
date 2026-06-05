import { SignIn, SignUp } from "@clerk/clerk-react";
import { Box, Button, Container, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AuthPage() {
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        py: 4,
      }}
    >
      <Typography variant="h4" fontWeight="bold">
        {t("appTitle")}
      </Typography>

      {isRegister ? <SignUp routing="hash" /> : <SignIn routing="hash" />}

      <Button
        variant="text"
        color="primary"
        onClick={() => setIsRegister((r) => !r)}
      >
        {isRegister ? t("alreadyHaveAccount") : t("noAccount")}
      </Button>
    </Container>
  );
}
