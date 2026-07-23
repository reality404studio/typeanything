"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import "./draw.css";

type DrawingMode = "orbit" | "bloom" | "signal";

type SceneRuntime = {
  camera: THREE.PerspectiveCamera;
  frame: number;
  marks: THREE.Group[];
  pointer: THREE.Vector2;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  world: THREE.Group;
};

const palette = {
  orbit: [0xc7ff5e, 0xf1efe9, 0x91a7ff],
  bloom: [0xff806e, 0xc7ff5e, 0x91a7ff, 0xf1efe9],
  signal: [0x91a7ff, 0xc7ff5e, 0xff806e],
};

const modeLabels: Record<DrawingMode, string> = {
  orbit: "Orbit",
  bloom: "Bloom",
  signal: "Signal",
};

const mobileKeyRows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

function addParticleHalo(group: THREE.Group, color: number, amount: number) {
  const positions = new Float32Array(amount * 3);
  for (let index = 0; index < amount; index += 1) {
    const radius = randomBetween(0.25, 1.15);
    const angle = randomBetween(0, Math.PI * 2);
    positions[index * 3] = Math.cos(angle) * radius;
    positions[index * 3 + 1] = Math.sin(angle) * radius;
    positions[index * 3 + 2] = randomBetween(-0.5, 0.5);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    blending: THREE.AdditiveBlending,
    color,
    depthWrite: false,
    opacity: 0.72,
    size: randomBetween(0.025, 0.055),
    transparent: true,
  });
  group.add(new THREE.Points(geometry, material));
}

function createOrbit(color: number, complexity: number) {
  const group = new THREE.Group();
  const ringCount = 1 + (complexity % 3);

  for (let index = 0; index < ringCount; index += 1) {
    const radius = randomBetween(0.38, 0.92) + index * 0.11;
    const geometry = new THREE.TorusGeometry(
      radius,
      randomBetween(0.008, 0.026),
      8,
      80,
    );
    const material = new THREE.MeshBasicMaterial({
      blending: THREE.AdditiveBlending,
      color,
      depthWrite: false,
      opacity: randomBetween(0.38, 0.78),
      transparent: true,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.set(
      randomBetween(-1.2, 1.2),
      randomBetween(-1.2, 1.2),
      randomBetween(-1.2, 1.2),
    );
    ring.scale.y = randomBetween(0.45, 1);
    group.add(ring);
  }

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(randomBetween(0.06, 0.13), 1),
    new THREE.MeshBasicMaterial({ color }),
  );
  core.position.set(randomBetween(-0.6, 0.6), randomBetween(-0.6, 0.6), 0);
  group.add(core);
  addParticleHalo(group, color, 12 + complexity);
  return group;
}

function createBloom(color: number, complexity: number) {
  const group = new THREE.Group();
  const petalCount = 4 + (complexity % 5);

  for (let index = 0; index < petalCount; index += 1) {
    const angle = (index / petalCount) * Math.PI * 2;
    const geometry = new THREE.SphereGeometry(randomBetween(0.2, 0.34), 16, 10);
    const material = new THREE.MeshPhongMaterial({
      blending: THREE.AdditiveBlending,
      color,
      emissive: color,
      emissiveIntensity: 0.34,
      opacity: randomBetween(0.13, 0.28),
      shininess: 90,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const petal = new THREE.Mesh(geometry, material);
    petal.scale.set(randomBetween(1.8, 2.8), randomBetween(0.28, 0.45), 0.68);
    petal.position.set(Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0);
    petal.rotation.z = angle;
    petal.rotation.x = randomBetween(-0.65, 0.65);
    group.add(petal);
  }

  group.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xf1efe9 }),
    ),
  );
  addParticleHalo(group, color, 18 + complexity * 2);
  return group;
}

function createSignal(color: number, complexity: number) {
  const group = new THREE.Group();
  const frameCount = 2 + (complexity % 4);

  for (let index = 0; index < frameCount; index += 1) {
    const size = randomBetween(0.38, 0.9) + index * 0.08;
    const geometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(size, size * randomBetween(0.45, 1.15), size),
    );
    const material = new THREE.LineBasicMaterial({
      blending: THREE.AdditiveBlending,
      color,
      opacity: randomBetween(0.32, 0.68),
      transparent: true,
    });
    const frame = new THREE.LineSegments(geometry, material);
    frame.position.set(index * 0.1, index * -0.07, index * 0.1);
    frame.rotation.set(
      randomBetween(-0.8, 0.8),
      randomBetween(-0.8, 0.8),
      randomBetween(-0.8, 0.8),
    );
    group.add(frame);
  }

  const path = [
    new THREE.Vector3(-0.8, randomBetween(-0.4, 0.4), randomBetween(-0.4, 0.4)),
    new THREE.Vector3(-0.2, randomBetween(-0.7, 0.7), randomBetween(-0.6, 0.6)),
    new THREE.Vector3(0.3, randomBetween(-0.7, 0.7), randomBetween(-0.6, 0.6)),
    new THREE.Vector3(0.9, randomBetween(-0.4, 0.4), randomBetween(-0.4, 0.4)),
  ];
  const curve = new THREE.CatmullRomCurve3(path);
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(44));
  const lineMaterial = new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    color,
    opacity: 0.78,
    transparent: true,
  });
  group.add(new THREE.Line(lineGeometry, lineMaterial));
  addParticleHalo(group, color, 10 + complexity);
  return group;
}

function createSpatialMark(mode: DrawingMode, key: string, index: number) {
  const code = key.codePointAt(0) ?? index;
  const colors = palette[mode];
  const color = colors[(code + index) % colors.length];
  const complexity = 2 + ((code + index) % 7);
  const group =
    mode === "orbit"
      ? createOrbit(color, complexity)
      : mode === "bloom"
        ? createBloom(color, complexity)
        : createSignal(color, complexity);

  group.position.set(
    randomBetween(-2.8, 2.8),
    randomBetween(-1.75, 1.75),
    randomBetween(-2.2, 1.35),
  );
  group.rotation.set(
    randomBetween(-Math.PI, Math.PI),
    randomBetween(-Math.PI, Math.PI),
    randomBetween(-Math.PI, Math.PI),
  );
  const scale = randomBetween(0.55, 1.22);
  group.scale.setScalar(scale);
  group.userData.baseScale = scale;
  group.userData.spin = new THREE.Vector3(
    randomBetween(-0.0045, 0.0045),
    randomBetween(-0.006, 0.006),
    randomBetween(-0.0035, 0.0035),
  );
  group.userData.phase = randomBetween(0, Math.PI * 2);
  group.userData.baseY = group.position.y;
  return group;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const renderable = child as THREE.Mesh | THREE.Line | THREE.Points;
    if (renderable.geometry) renderable.geometry.dispose();
    const materials = Array.isArray(renderable.material)
      ? renderable.material
      : renderable.material
        ? [renderable.material]
        : [];
    materials.forEach((material) => material.dispose());
  });
}

function addStarField(scene: THREE.Scene) {
  const positions = new Float32Array(360 * 3);
  for (let index = 0; index < 360; index += 1) {
    positions[index * 3] = randomBetween(-9, 9);
    positions[index * 3 + 1] = randomBetween(-5.5, 5.5);
    positions[index * 3 + 2] = randomBetween(-8, 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x91a7ff,
    depthWrite: false,
    opacity: 0.24,
    size: 0.018,
    transparent: true,
  });
  scene.add(new THREE.Points(geometry, material));
}

function MobileKeyboard({
  onClear,
  onKey,
  onUndo,
}: {
  onClear: () => void;
  onKey: (key: string) => void;
  onUndo: () => void;
}) {
  return (
    <section className="mobile-keyboard" aria-label="모바일 전용 고정 자판">
      <div className="mobile-keyboard-handle" aria-hidden="true" />
      {mobileKeyRows.map((row, rowIndex) => (
        <div
          className={`mobile-key-row mobile-key-row-${rowIndex + 1}`}
          key={row.join("")}
        >
          {row.map((key) => (
            <button
              aria-label={`${key} 키로 입체 오브젝트 만들기`}
              className="mobile-key"
              key={key}
              onClick={() => onKey(key)}
              type="button"
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <div className="mobile-key-row mobile-key-actions">
        <button className="mobile-key mobile-action-key" onClick={onUndo} type="button">
          Undo
        </button>
        <button
          aria-label="스페이스 키로 입체 오브젝트 만들기"
          className="mobile-key mobile-space-key"
          onClick={() => onKey(" ")}
          type="button"
        >
          Space
        </button>
        <button className="mobile-key mobile-action-key" onClick={onClear} type="button">
          Clear
        </button>
      </div>
    </section>
  );
}

export default function DrawingPage() {
  const [mode, setMode] = useState<DrawingMode>("orbit");
  const [markCount, setMarkCount] = useState(0);
  const [pulse, setPulse] = useState(false);
  const [webglError, setWebglError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureRef = useRef<HTMLTextAreaElement>(null);
  const modeRef = useRef<DrawingMode>("orbit");
  const isMobileRef = useRef(false);
  const pendingKeysRef = useRef<string[]>([]);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runtimeRef = useRef<SceneRuntime | null>(null);

  const focusDesktopCapture = useCallback(() => {
    if (!isMobileRef.current) captureRef.current?.focus();
  }, []);

  const addMark = useCallback((key: string) => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      pendingKeysRef.current.push(key);
      return;
    }

    const group = createSpatialMark(modeRef.current, key, runtime.marks.length);
    runtime.world.add(group);
    runtime.marks.push(group);

    const objectLimit = isMobileRef.current ? 54 : 84;
    if (runtime.marks.length > objectLimit) {
      const oldest = runtime.marks.shift();
      if (oldest) {
        runtime.world.remove(oldest);
        disposeObject(oldest);
      }
    }

    setMarkCount(runtime.marks.length);
    setPulse(true);
    if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    pulseTimerRef.current = setTimeout(() => setPulse(false), 90);
  }, []);

  const undo = useCallback(() => {
    const runtime = runtimeRef.current;
    if (!runtime) {
      pendingKeysRef.current.pop();
      return;
    }
    if (!runtime.marks.length) return;
    const last = runtime.marks.pop();
    if (last) {
      runtime.world.remove(last);
      disposeObject(last);
    }
    setMarkCount(runtime.marks.length);
    focusDesktopCapture();
  }, [focusDesktopCapture]);

  const clearScene = useCallback(() => {
    const runtime = runtimeRef.current;
    pendingKeysRef.current = [];
    if (!runtime) return;
    runtime.marks.forEach((mark) => {
      runtime.world.remove(mark);
      disposeObject(mark);
    });
    runtime.marks = [];
    setMarkCount(0);
    focusDesktopCapture();
  }, [focusDesktopCapture]);

  const changeMode = (nextMode: DrawingMode) => {
    modeRef.current = nextMode;
    setMode(nextMode);
    focusDesktopCapture();
  };

  const downloadArtwork = () => {
    const runtime = runtimeRef.current;
    const canvas = canvasRef.current;
    if (!runtime || !canvas) return;
    runtime.renderer.render(runtime.scene, runtime.camera);

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
    anchor.download = `deep-work-three-${Date.now()}.png`;
    anchor.click();
    focusDesktopCapture();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    isMobileRef.current = window.matchMedia(
      "(max-width: 820px) and (pointer: coarse)",
    ).matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.setClearColor(0x0b0c0f, 0);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, isMobileRef.current ? 1.5 : 2),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0c0f, 0.055);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const world = new THREE.Group();
    scene.add(world);
    scene.add(new THREE.AmbientLight(0x91a7ff, 0.46));

    const limeLight = new THREE.PointLight(0xc7ff5e, 14, 18);
    limeLight.position.set(4, 3, 5);
    scene.add(limeLight);
    const coralLight = new THREE.PointLight(0xff806e, 11, 16);
    coralLight.position.set(-4, -2, 4);
    scene.add(coralLight);
    addStarField(scene);

    const runtime: SceneRuntime = {
      camera,
      frame: 0,
      marks: [],
      pointer: new THREE.Vector2(),
      renderer,
      scene,
      world,
    };
    runtimeRef.current = runtime;
    pendingKeysRef.current.splice(0).forEach((key) => addMark(key));

    const resizeTarget = canvas.parentElement ?? canvas;
    const resize = () => {
      const bounds = resizeTarget.getBoundingClientRect();
      renderer.setSize(bounds.width, bounds.height, false);
      camera.aspect = bounds.width / Math.max(bounds.height, 1);
      camera.updateProjectionMatrix();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(resizeTarget);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startedAt) / 1000;
      const motion = reducedMotion ? 0 : 1;
      runtime.frame = window.requestAnimationFrame(animate);
      world.rotation.y +=
        (runtime.pointer.x * 0.16 - world.rotation.y) * 0.018 * motion;
      world.rotation.x +=
        (-runtime.pointer.y * 0.1 - world.rotation.x) * 0.018 * motion;

      runtime.marks.forEach((mark, index) => {
        const spin = mark.userData.spin as THREE.Vector3;
        mark.rotation.x += spin.x * motion;
        mark.rotation.y += spin.y * motion;
        mark.rotation.z += spin.z * motion;
        mark.position.y =
          (mark.userData.baseY as number) +
          Math.sin(elapsed * 0.42 + (mark.userData.phase as number)) *
            0.055 *
            motion;
        const baseScale = mark.userData.baseScale as number;
        mark.scale.setScalar(
          baseScale * (1 + Math.sin(elapsed * 0.7 + index) * 0.012 * motion),
        );
      });

      camera.position.x += (runtime.pointer.x * 0.28 - camera.position.x) * 0.01 * motion;
      camera.position.y += (-runtime.pointer.y * 0.18 - camera.position.y) * 0.01 * motion;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    runtime.frame = window.requestAnimationFrame(animate);
    focusDesktopCapture();

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(runtime.frame);
      disposeObject(scene);
      renderer.dispose();
      runtimeRef.current = null;
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, [addMark, focusDesktopCapture]);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      const canvas = canvasRef.current;
      const runtime = runtimeRef.current;
      if (!canvas || !runtime) return;
      const bounds = canvas.getBoundingClientRect();
      runtime.pointer.set(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
      );
    };

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
      if (event.key === "Escape") clearScene();
      else if (event.key === "Backspace" || event.key === "Delete") undo();
      else addMark(event.key);
    };

    window.addEventListener("pointermove", handlePointer, { passive: true });
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [addMark, clearScene, undo]);

  const handleCaptureKey = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (["Meta", "Control", "Alt", "Shift", "CapsLock", "Tab"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    if (event.key === "Escape") clearScene();
    else if (event.key === "Backspace" || event.key === "Delete") undo();
    else addMark(event.key);
  };

  const completion = Math.min(100, (markCount / 54) * 100);

  return (
    <div className="drawing-page three-drawing-page">
      <div className={`draw-flash${pulse ? " on" : ""}`} />
      <div className="draw-shell">
        <header>
          <a className="draw-brand" href="/" aria-label="문장 타이핑 페이지로 이동">
            <span className="pulse" />
            Deep Work / Three.js
          </a>

          <div className="controls" aria-label="입체 그림 제어">
            <div className="control-group" aria-label="입체 조형 스타일">
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

            <div className="control-group" aria-label="장면 작업">
              <button className="control-btn" onClick={undo} type="button">
                Undo
              </button>
              <button className="control-btn" onClick={clearScene} type="button">
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
            focusDesktopCapture();
            if (!runtimeRef.current?.marks.length) addMark("start");
          }}
          tabIndex={-1}
        >
          <aside className="rail draw-rail">
            <span>SPACE / 001</span>
          </aside>

          <section className="canvas-stage">
            <div className="canvas-eyebrow">
              Three.js spatial study · {modeLabels[mode].toLowerCase()}
            </div>
            <canvas
              aria-label={`키 입력으로 만든 입체 조형물. 현재 ${markCount}개의 오브젝트가 있습니다.`}
              className="art-canvas webgl-canvas"
              ref={canvasRef}
              role="img"
            />

            {webglError ? (
              <div className="webgl-error">
                이 브라우저에서는 3D 그래픽을 시작할 수 없습니다.
              </div>
            ) : (
              <div className={`draw-hint${markCount ? " hidden" : ""}`}>
                <span className="key">ANY KEY</span>
                <span>타이핑할수록 공간에 조형물이 쌓입니다</span>
              </div>
            )}

            <textarea
              aria-label="입체 그림을 만들기 위한 키보드 입력"
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
              현재 {markCount}개의 입체 오브젝트가 만들어졌습니다.
            </div>
          </section>

          <div className="progress-wrap">
            <div id="draw-progress" style={{ width: `${completion}%` }} />
          </div>
        </main>

        <footer>
          <span>
            Spatial density: <span className="count">{Math.round(completion)}</span>%
          </span>
          <span>
            <span className="count">{markCount.toLocaleString()}</span> objects
          </span>
        </footer>
      </div>
      <MobileKeyboard onClear={clearScene} onKey={addMark} onUndo={undo} />
    </div>
  );
}
