import { Alert, Divider, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import TaskCard from "../TaskCard/TaskCard";
import { ITaskListSectionProps } from "../../utils/interfaces";

export default function TaskListSection({
  incompleteTasks,
  completedTasks,
  assignedTaskId,
}: ITaskListSectionProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        {t("yourTasksTitle")}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {t("yourTasksHint")}
      </Typography>

      {incompleteTasks.length === 0 ? (
        <Alert severity="info">{t("taskPendingEmpty")}</Alert>
      ) : (
        <Stack spacing={1}>
          {incompleteTasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              difficulty={task.difficulty}
              status={
                task.id === assignedTaskId
                  ? t("statusAssigned")
                  : t("statusPending")
              }
              isSelected={task.id === assignedTaskId}
            />
          ))}
        </Stack>
      )}

      {completedTasks.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            {t("tasksCompletedTitle")}
          </Typography>
          <Stack spacing={1}>
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                title={task.title}
                difficulty={task.difficulty}
                status={t("statusCompleted")}
              />
            ))}
          </Stack>
        </>
      )}
    </Paper>
  );
}
