import WheelComponent from "./WheelCanvas";
import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [wheelSize, setWheelSize] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = (width: number) => {
      // size = radius; the library renders a canvas of size*2 px wide
      setWheelSize(Math.floor(width / 2));
    };

    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w > 0) update(w);
    });

    observer.observe(el);
    const w = el.getBoundingClientRect().width;
    if (w > 0) update(w);

    return () => observer.disconnect();
  }, []);

  const segments = tasks.map((task) => task.title);

  const segColors = tasks.map(
    (_, i) => WHEEL_PASTEL_COLORS[i % WHEEL_PASTEL_COLORS.length] as string
  );

  const handleFinished = (winnerTitle: string) => {
    const idx = segments.indexOf(winnerTitle);
    const task = idx !== -1 ? tasks[idx] : tasks.find((t) => t.title.startsWith(winnerTitle.replace("…", "")));
    if (task) onSelect(task);
  };

  return (
    // ref always attached regardless of tasks state so ResizeObserver has a valid element
    <Box ref={containerRef} sx={{ width: "100%" }}>
      {tasks.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
          {t("noTasksToSpin", "No hay tareas para girar")}
        </Typography>
      ) : wheelSize > 0 ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <WheelComponent
            key={wheelSize}
            segments={segments}
            segColors={segColors}
            winningSegment=""
            onFinished={handleFinished}
            primaryColor={WHEEL_PRIMARY_COLOR}
            contrastColor={WHEEL_TEXT_COLOR}
            buttonText={t("spin", "Girar")}
            isOnlyOnce={false}
            size={wheelSize}
            upDuration={100}
            downDuration={700}
            fontFamily={WHEEL_FONT_FAMILY}
            fontSize={`${Math.min(15, Math.max(9, Math.floor(wheelSize * 0.055)))}px`}
          />
        </Box>
      ) : null}
    </Box>
  );
}
