import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskWheel from "../TaskWheel/TaskWheel";
import { ISpinWheelSectionProps } from "../../utils/interfaces";

export default function SpinWheelSection({
  tasks,
  onSelect,
}: ISpinWheelSectionProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
        {t("spinWheelTitle")}
      </Typography>
      <TaskWheel tasks={tasks} onSelect={onSelect} />
    </Paper>
  );
}
