import WheelComponent from "react-wheel-of-prizes";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { ITaskWheelProps } from "../../utils/interfaces";
import {
  WHEEL_PASTEL_COLORS,
  WHEEL_TEXT_COLOR,
  WHEEL_PRIMARY_COLOR,
  WHEEL_FONT_FAMILY,
} from "../../globals";

export default function TaskWheel({ tasks, onSelect }: ITaskWheelProps) {
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
        {t("noTasksToSpin", "No hay tareas para girar")}
      </Typography>
    );
  }

  const segments = tasks.map((task) =>
    task.title.length > 22 ? task.title.slice(0, 20) + "…" : task.title
  );

  const segColors = tasks.map(
    (_, i) => WHEEL_PASTEL_COLORS[i % WHEEL_PASTEL_COLORS.length] as string
  );

  const handleFinished = (winnerTitle: string) => {
    const idx = segments.indexOf(winnerTitle);
    const task = idx !== -1 ? tasks[idx] : tasks.find((t) => t.title.startsWith(winnerTitle.replace("…", "")));
    if (task) onSelect(task);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", overflow: "hidden" }}>
      <WheelComponent
        segments={segments}
        segColors={segColors}
        winningSegment=""
        onFinished={handleFinished}
        primaryColor={WHEEL_PRIMARY_COLOR}
        contrastColor={WHEEL_TEXT_COLOR}
        buttonText={t("spin", "Girar")}
        isOnlyOnce={false}
        size={280}
        upDuration={100}
        downDuration={700}
        fontFamily={WHEEL_FONT_FAMILY}
      />
    </Box>
  );
}
