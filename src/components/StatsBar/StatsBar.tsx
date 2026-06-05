import { Box, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IStatsBarProps } from "../../utils/interfaces";

export default function StatsBar({ points, pendingCount }: IStatsBarProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Paper elevation={2} sx={{ p: 2, textAlign: "center", flex: 1 }}>
        <Typography variant="h4" color="primary">
          {points}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("pointsAccumulated")}
        </Typography>
      </Paper>
      <Paper elevation={2} sx={{ p: 2, textAlign: "center", flex: 1 }}>
        <Typography variant="h4" color="primary">
          {pendingCount}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("tasksPending")}
        </Typography>
      </Paper>
    </Box>
  );
}
