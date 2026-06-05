import { Alert, Button, Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskCard from "../TaskCard/TaskCard";
import { IActiveTaskSectionProps } from "../../utils/interfaces";

export default function ActiveTaskSection({
  assignedTask,
  onComplete,
}: IActiveTaskSectionProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        {t("activeTask")}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t("activeTaskHint")}
      </Typography>

      {assignedTask ? (
        <TaskCard
          title={assignedTask.title}
          difficulty={assignedTask.difficulty}
          status={
            assignedTask.completed ? t("statusCompleted") : t("statusActive")
          }
          isSelected
        />
      ) : (
        <Alert severity="info">{t("noAssignedTask")}</Alert>
      )}

      <Button
        variant="contained"
        fullWidth
        sx={{ mt: 2 }}
        onClick={onComplete}
        disabled={!assignedTask || assignedTask.completed}
      >
        {t("completeButton")}
      </Button>
    </Paper>
  );
}
