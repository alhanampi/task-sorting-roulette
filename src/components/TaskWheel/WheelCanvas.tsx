import { useEffect, useRef, useState } from "react";
import { IWheelCanvasProps } from "../../utils/interfaces";

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export default function WheelCanvas({
  segments,
  segColors,
  winningSegment = "",
  onFinished,
  primaryColor = "black",
  contrastColor = "white",
  buttonText = "Spin",
  isOnlyOnce = true,
  size = 300,
  upDuration = 100,
  downDuration = 1000,
  fontFamily = "Arial, sans-serif",
  fontSize = "1em",
  outlineWidth = 10,
}: IWheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFinished, setIsFinished] = useState(false);

  const dimension = (size + 20) * 2;
  const centerX = size + 20;
  const centerY = size + 20;

  // Mutable spin state kept in refs to avoid stale closures in animation loop
  const state = useRef({
    angleCurrent: 0,
    angleDelta: 0,
    timerHandle: 0,
    spinStart: 0,
    frames: 0,
    isStarted: false,
    currentSegment: "",
  });

  const maxSpeed = Math.PI / segments.length;
  const upTime = segments.length * upDuration;
  const downTime = segments.length * downDuration;

  const getCtx = () => canvasRef.current?.getContext("2d") ?? null;

  const drawSegment = (
    ctx: CanvasRenderingContext2D,
    key: number,
    lastAngle: number,
    angle: number
  ) => {
    const value = segments[key];
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, size, lastAngle, angle, false);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = segColors[key % segColors.length];
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((lastAngle + angle) / 2);
    ctx.fillStyle = contrastColor;
    ctx.font = `bold ${fontSize} ${fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Available width along the radius for text
    const maxWidth = size * 0.6;
    const lines = wrapText(ctx, value, maxWidth);
    // Approximate line height from measured cap height
    const lineHeight = ctx.measureText("M").width * 1.8;
    const totalHeight = (lines.length - 1) * lineHeight;
    const textX = size / 2 + 20;

    lines.forEach((line, i) => {
      ctx.fillText(line, textX, i * lineHeight - totalHeight / 2);
    });

    ctx.restore();
    ctx.restore();
  };

  const drawNeedle = (ctx: CanvasRenderingContext2D) => {
    const { angleCurrent, isStarted, currentSegment } = state.current;
    ctx.lineWidth = 1;
    ctx.strokeStyle = contrastColor;
    ctx.fillStyle = contrastColor;
    ctx.beginPath();
    ctx.moveTo(centerX + 20, centerY - 50);
    ctx.lineTo(centerX - 20, centerY - 50);
    ctx.lineTo(centerX, centerY - 70);
    ctx.closePath();
    ctx.fill();

    const change = angleCurrent + Math.PI / 2;
    let i =
      segments.length - Math.floor((change / (Math.PI * 2)) * segments.length) - 1;
    if (i < 0) i += segments.length;
    state.current.currentSegment = segments[i];

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = primaryColor;
    ctx.font = `bold 1.5em ${fontFamily}`;
    if (isStarted) {
      ctx.fillText(currentSegment, centerX + 10, centerY + size + 50);
    }
  };

  const drawWheel = (ctx: CanvasRenderingContext2D) => {
    const { angleCurrent } = state.current;
    const PI2 = Math.PI * 2;
    ctx.lineWidth = 1;
    ctx.strokeStyle = primaryColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.font = `1em ${fontFamily}`;

    let lastAngle = angleCurrent;
    for (let i = 1; i <= segments.length; i++) {
      const angle = PI2 * (i / segments.length) + angleCurrent;
      drawSegment(ctx, i - 1, lastAngle, angle);
      lastAngle = angle;
    }

    // Center button
    ctx.beginPath();
    ctx.arc(centerX, centerY, 50, 0, PI2, false);
    ctx.closePath();
    ctx.fillStyle = primaryColor;
    ctx.lineWidth = 10;
    ctx.strokeStyle = contrastColor;
    ctx.fill();
    ctx.font = `bold 1em ${fontFamily}`;
    ctx.fillStyle = contrastColor;
    ctx.textAlign = "center";
    ctx.fillText(buttonText, centerX, centerY + 3);
    ctx.stroke();

    // Outer ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, PI2, false);
    ctx.closePath();
    ctx.lineWidth = outlineWidth;
    ctx.strokeStyle = primaryColor;
    ctx.stroke();
  };

  const draw = () => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.clearRect(0, 0, dimension, dimension);
    drawWheel(ctx);
    drawNeedle(ctx);
  };

  const onTimerTick = () => {
    const s = state.current;
    s.frames++;
    draw();

    const duration = Date.now() - s.spinStart;
    let finished = false;

    if (duration < upTime) {
      s.angleDelta = maxSpeed * Math.sin((duration / upTime) * Math.PI / 2);
    } else {
      if (winningSegment) {
        if (s.currentSegment === winningSegment && s.frames > segments.length) {
          const p = duration / upTime;
          s.angleDelta = maxSpeed * Math.sin(p * Math.PI / 2 + Math.PI / 2);
          if (duration / upTime >= 1) finished = true;
        } else {
          const p = duration / downTime;
          s.angleDelta = maxSpeed * Math.sin(p * Math.PI / 2 + Math.PI / 2);
          if (p >= 1) finished = true;
        }
      } else {
        const p = duration / downTime;
        s.angleDelta = maxSpeed * Math.sin(p * Math.PI / 2 + Math.PI / 2);
        if (p >= 1) finished = true;
      }
    }

    s.angleCurrent += s.angleDelta;
    while (s.angleCurrent >= Math.PI * 2) s.angleCurrent -= Math.PI * 2;

    if (finished) {
      setIsFinished(true);
      onFinished(s.currentSegment);
      clearInterval(s.timerHandle);
      s.timerHandle = 0;
      s.angleDelta = 0;
    }
  };

  const spin = () => {
    const s = state.current;
    s.isStarted = true;
    if (s.timerHandle === 0) {
      s.spinStart = Date.now();
      s.frames = 0;
      s.timerHandle = window.setInterval(onTimerTick, segments.length);
    }
  };

  useEffect(() => {
    draw();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments, size]);

  return (
    <canvas
      ref={canvasRef}
      width={dimension}
      height={dimension}
      style={{ pointerEvents: isFinished && isOnlyOnce ? "none" : "auto", display: "block" }}
      onClick={spin}
    />
  );
}
