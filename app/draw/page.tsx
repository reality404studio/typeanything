"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./draw.css";

type DrawingMode = "orbit" | "bloom" | "signal";

type Mark = {
  mode: DrawingMode;
  color: string;
  x: number;
  y: number;
  x2: number;
  y2: number;
  controlX: number;
  controlY: number;
  radius: number;
  width: number;
  rotation: number;
  alpha: number;
  satellites: number;
};

const palette = {
  orbit: ["#c7ff5e", "#f1efe9", "#91a7ff"],
  bloom: ["#ff806e", "#c7ff5e", "#91a7ff", "#f1efe9"],
  signal: ["#91a7ff", "#c7ff5e", "#ff806e"],
};

const modeLabels: Record<DrawingMode, string> = {
  orbit: "Orbit",
  bloom: "Bloom",
  signal: "Signal",
};

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

function createMark(mode: DrawingMode, key: string, index: number): Mark {
  const charCode = key.length ? key.codePointAt(0) ?? 0 : 0;
  const colors = palette[mode];
  const bias = ((charCode * 17 + index * 29) % 100) / 100;

  return {
    mode,
    color: colors[(charCode + index) % colors.length],
    x: randomBetween(0.12, 0.88),
    y: randomBetween(0.13, 0.87),
    x2: randomBetween(0.12, 0.88),
    y2: randomBetween(0.13, 0.87),
    controlX: randomBetween(0.08, 0.92),
    controlY: randomBetween(0.08, 0.92),
    radius: randomBetween(0.025, 0.13) * (0.7 + bias * 0.65),
    width: randomBetween(0.7, 2.7),
    rotation: randomBetween(0, Math.PI * 2),
    alpha: randomBetween(0.42, 0.86),
    satellites: 2 + ((charCode + index) % 6),
  };
}

function paintMark(
  context: CanvasRenderingContext2D,
  mark: Mark,
  width: number,
  height: number,
) {
  const x = mark.x * width;
  const y = mark.y * height;
  const x2 = mark.x2 * width;
  const y2 = mark.y2 * height;
  const controlX = mark.controlX * width;
  const controlY = mark.controlY * height;
  const radius = mark.radius * Math.min(width, height);

  context.save();
  context.globalCompositeOperation = "screen";
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = mark.color;
  context.fillStyle = mark.color;
  context.lineWidth = mark.width;
  context.globalAlpha = mark.alpha;

  if (mark.mode === "orbit") {
    context.beginPath();
    context.moveTo(x, y);
    context.bezierCurveTo(controlX, controlY, x2, y, x2, y2);
    context.stroke();

    context.globalAlpha = mark.alpha * 0.5;
    context.beginPath();
    context.ellipse(
      x,
      y,
      radius * 1.65,
      radius * 0.72,
      mark.rotation,
      0,
      Math.PI * 1.72,
    );
    context.stroke();

    for (let index = 0; index < mark.satellites; index += 1) {
      const angle = mark.rotation + (index / mark.satellites) * Math.PI * 2;
      context.globalAlpha = mark.alpha * (0.45 + index / mark.satellites / 2);
      context.beginPath();
      context.arc(
        x + Math.cos(angle) * radius * 1.7,
        y + Math.sin(angle) * radius * 0.78,
        Math.max(1.3, mark.width * 1.15),
        0,
        Math.PI * 2,
      );
      context.fill();
    }
  }

  if (mark.mode === "bloom") {
    context.translate(x, y);
    context.rotate(mark.rotation);
    for (let index = 0; index < mark.satellites; index += 1) {
      const angle = (index / mark.satellites) * Math.PI * 2;
      context.save();
      context.rotate(angle);
      context.globalAlpha = mark.alpha * 0.16;
      context.beginPath();
      context.ellipse(
        radius * 0.72,
        0,
        radius,
        radius * 0.34,
        0,
        0,
        Math.PI * 2,
      );
      context.fill();
      context.globalAlpha = mark.alpha * 0.54;
      context.stroke();
      context.restore();
    }
    context.globalAlpha = mark.alpha;
    context.beginPath();
    context.arc(0, 0, Math.max(1.8, mark.width * 1.4), 0, Math.PI * 2);
    context.fill();
  }

  if (mark.mode === "signal") {
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(controlX, y);
    context.lineTo(controlX, controlY);
    context.lineTo(x2, controlY);
    context.lineTo(x2, y2);
    context.stroke();

    context.globalAlpha = mark.alpha * 0.32;
    for (let index = 1; index <= mark.satellites; index += 1) {
      const offset = index * 4.5;
      context.beginPath();
      context.moveTo(x + offset, y + offset);
      context.lineTo(controlX + offset, y + offset);
      context.lineTo(controlX + offset, controlY + offset);
      context.stroke();
    }

    context.globalAlpha = mark.alpha;
    context.beginPath();
    context.arc(x2, y2, Math.max(2, mark.width * 1.45), 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
}

export default function DrawingPage() {
  const [mode, setMode] = useState<DrawingMode>("orbit");
  const [markCount, setMarkCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const surfaceRef = useRef<HTMLElement>(null);
  const captureRef = useRef<HTMLTextAreaElement>(null);
  const marksRef = useRef<Mark[]>([]);
  const modeRef = useRef<DrawingMode>("orbit");
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const bounds = canvas.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    if (
      canvas.width !== Math.round(bounds.width * pixelRatio) ||
      canvas.height !== Math.round(bounds.height * pixelRatio)
    ) {
      canvas.width = Math.round(bounds.width * pixelRatio);
      canvas.height = Math.round(bounds.height * pixelRatio);
    }

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, bounds.width, bounds.height);

    const gradient = context.createRadialGradient(
      bounds.width * 0.55,
      bounds.height * 0.48,
      0,
      bounds.width * 0.55,
      bounds.height * 0.48,
      Math.max(bounds.width, bounds.height) * 0.7,
    );
    gradient.addColorStop(0, "rgba(145, 167, 255, 0.035)");
    gradient.addColorStop(1, "rgba(11, 12, 15, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, bounds.width, bounds.height);

    marksRef.current.forEach((mark) =>
      paintMark(context, mark, bounds.width, bounds.height),
    );
  }, []);

  const addMark = useCallback(
    (key: string) => {
      const mark = createMark(modeRef.current, key, marksRef.current.length);
      marksRef.current.push(mark);
      setMarkCount(marksRef.current.length);
      setPulse(true);
      renderCanvas();

      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = setTimeout(() => setPulse(false), 90);
    },
    [renderCanvas],
  );

  const undo = useCallback(() => {
    if (!marksRef.current.length) return;
    marksRef.current.pop();
    setMarkCount(marksRef.current.length);
    renderCanvas();
  }, [renderCanvas]);

  const clearCanvas = useCallback(() => {
    marksRef.current = [];
    setMarkCount(0);
    renderCanvas();
    captureRef.current?.focus();
  }, [renderCanvas]);

  const changeMode = (nextMode: DrawingMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
    captureRef.current?.focus();
  };

  const downloadArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const context = exportCanvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#0b0c0f";
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.drawImage(canvas, 0, 0);

    const anchor = document.createElement("a");
    anchor.href = exportCanvas.toDataURL("image/png");
    anchor.download = `deep-work-drawing-${Date.now()}.png`;
    anchor.click();
    captureRef.current?.focus();
  };

  useEffect(() => {
    renderCanvas();
    const observer = new ResizeObserver(renderCanvas);
    if (canvasRef.current) observer.observe(canvasRef.current);
    captureRef.current?.focus();

    return () => {
      observer.disconnect();
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [renderCanvas]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLButtonElement ||
        target instanceof HTMLAnchorElement ||
        target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (["Meta", "Control", "Alt", "Shift", "CapsLock", "Tab"].includes(event.key)) {
        return;
      }

      event.preventDefault();
      if (event.key === "Escape") clearCanvas();
      else if (event.key === "Backspace" || event.key === "Delete") undo();
      else addMark(event.key);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [addMark, clearCanvas, undo]);

  const handleCaptureKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (["Meta", "Control", "Alt", "Shift", "CapsLock", "Tab"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    if (event.key === "Escape") clearCanvas();
    else if (event.key === "Backspace" || event.key === "Delete") undo();
    else addMark(event.key);
  };

  const completion = Math.min(100, (markCount / 72) * 100);

  return (
    <div className="drawing-page">
      <div className={`draw-flash${pulse ? " on" : ""}`} />
      <div className="draw-shell">
        <header>
          <a className="draw-brand" href="/" aria-label="문장 타이핑 페이지로 이동">
            <span className="pulse" />
            Deep Work / Draw
          </a>

          <div className="controls" aria-label="그림 제어">
            <div className="control-group" aria-label="그림 스타일">
              {(Object.keys(modeLabels) as DrawingMode[]).map((option) => (
                <button
                  className={`control-btn${mode === option ? " active" : ""}`}
                  key={option}
                  onClick={() => changeMode(option)}
                  type="button"
                >
                  {modeLabels[option]}
                </button>
              ))}
            </div>

            <div className="control-group" aria-label="캔버스 작업">
              <button className="control-btn" onClick={undo} type="button">
                Undo
              </button>
              <button className="control-btn" onClick={clearCanvas} type="button">
                Clear
              </button>
              <button
                className="control-btn save-control"
                disabled={!markCount}
                onClick={downloadArtwork}
                type="button"
              >
                Save PNG
              </button>
            </div>
          </div>
        </header>

        <main
          className="canvas-surface"
          onClick={() => {
            captureRef.current?.focus();
            if (!marksRef.current.length) addMark("start");
          }}
          ref={surfaceRef}
          tabIndex={-1}
        >
          <aside className="rail draw-rail">
            <span>CANVAS / 001</span>
          </aside>

          <section className="canvas-stage">
            <div className="canvas-eyebrow">
              Generative study · {modeLabels[mode].toLowerCase()}
            </div>
            <canvas
              aria-label={`키 입력으로 그린 추상화. 현재 ${markCount}개의 획이 있습니다.`}
              className="art-canvas"
              ref={canvasRef}
              role="img"
            />

            <div className={`draw-hint${markCount ? " hidden" : ""}`}>
              <span className="key">ANY KEY</span>
              <span>아무렇게나 타이핑하면 그림이 시작됩니다</span>
            </div>

            <textarea
              aria-label="그림을 그리기 위한 키보드 입력"
              autoComplete="off"
              className="keyboard-capture"
              onChange={(event) => {
                event.currentTarget.value = "";
              }}
              onKeyDown={handleCaptureKey}
              ref={captureRef}
              rows={1}
              spellCheck={false}
              value=""
            />

            <div aria-live="polite" className="sr-only">
              현재 {markCount}개의 획이 그려졌습니다.
            </div>
          </section>

          <div className="progress-wrap">
            <div id="draw-progress" style={{ width: `${completion}%` }} />
          </div>
        </main>

        <footer>
          <span>
            Visual density: <span className="count">{Math.round(completion)}</span>%
          </span>
          <span>
            <span className="count">{markCount.toLocaleString()}</span> strokes
          </span>
        </footer>
      </div>
    </div>
  );
}
