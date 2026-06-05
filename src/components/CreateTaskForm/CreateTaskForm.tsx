import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ICreateTaskFormProps } from "../../utils/interfaces";

export default function CreateTaskForm({
  taskTitle,
  onTaskTitleChange,
  difficulty,
  onDifficultyChange,
  onSubmit,
}: ICreateTaskFormProps) {
  const { t } = useTranslation();

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="subtitle1" fontWeight="bold" mb={2}>
        {t("createTaskTitle")}
      </Typography>

      <Stack spacing={2}>
        <TextField
          label={t("taskTitleLabel")}
          size="small"
          fullWidth
          value={taskTitle}
          onChange={(e) => onTaskTitleChange(e.target.value)}
          placeholder={t("taskPlaceholder")}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />

        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mb={1}
          >
            {t("difficultyLabel")}
          </Typography>
          <Stack direction="row" spacing={1}>
            {[1, 2, 3, 4, 5].map((v) => (
              <Chip
                key={v}
                label={v}
                onClick={() => onDifficultyChange(v)}
                color={difficulty === v ? "primary" : "default"}
                variant={difficulty === v ? "filled" : "outlined"}
                sx={{ cursor: "pointer", minWidth: 40 }}
              />
            ))}
          </Stack>
        </Box>

        <Button variant="contained" onClick={onSubmit}>
          {t("createTaskButton")}
        </Button>
      </Stack>
    </Paper>
  );
}
