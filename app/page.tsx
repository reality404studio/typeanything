"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Language = "ko" | "en";
type FontSize = "small" | "medium" | "big";

const content = {
  ko: {
    passages: [
      "중요한 것은 더 많은 일을 처리하는 속도가 아니라, 무엇을 남길지 결정하는 감각이다. 지금 우리는 흩어진 신호를 하나의 방향으로 정렬하고 있다.",
      "좋은 결과는 대개 선명한 확신에서 시작되지 않는다. 작은 불편을 오래 바라보고, 아직 이름 붙지 않은 가능성을 끝까지 놓치지 않는 태도에서 시작된다.",
      "완성도는 장식을 더하는 과정이 아니다. 핵심이 아닌 것을 조용히 걷어내고, 마지막까지 살아남은 한 문장을 믿는 일이다.",
      "우리가 만드는 것은 기능의 목록이 아니라 새로운 행동의 리듬이다. 사람은 설명보다 경험을 기억하고, 경험은 아주 작은 디테일에서 결정된다.",
      "속도는 서두름과 다르다. 방향이 분명할수록 움직임은 가벼워지고, 불필요한 회의와 망설임은 자연스럽게 사라진다.",
      "아직 정답은 없지만 기준은 있다. 더 단순할 것, 더 정직할 것, 그리고 사용하는 사람의 시간을 함부로 다루지 않을 것.",
      "오늘의 작업은 눈에 보이는 산출물보다 더 깊은 곳을 바꾸고 있다. 생각의 구조가 정리되면 다음 결정은 놀라울 만큼 쉬워진다.",
      "작은 프로토타입은 거대한 계획보다 많은 것을 말한다. 실제로 움직이는 한 장면이 수십 페이지의 설명을 대신한다.",
      "집중은 세상을 차단하는 일이 아니라, 지금 가장 중요한 신호만 남기는 기술이다. 우리는 그 신호를 문장과 형태로 번역하고 있다.",
      "결국 사람을 움직이는 것은 정보의 양이 아니다. 자신을 정확히 이해받았다는 짧은 감각, 그리고 다음 행동이 보인다는 안도감이다.",
      "모든 좋은 작업에는 고유한 온도가 있다. 너무 차갑지도, 지나치게 친절하지도 않은 상태에서 아이디어는 가장 오래 살아남는다.",
      "우리는 거창한 미래를 약속하지 않는다. 다만 오늘보다 조금 더 자연스럽고, 조금 덜 피곤한 내일을 구체적으로 설계한다.",
    ],
    hint: "아무렇게나 타이핑하세요",
    eyebrow: "작업 중인 초안 · 실시간",
    document: "문서 / 001",
    velocity: "사고 속도",
    count: "타건",
    aria: "아무 키나 입력하면 문장이 작성됩니다",
    accents: /(중요한|감각|가능성|완성도|경험|기준|프로토타입|집중|다음 행동|온도|내일)/g,
    dims: /(아직|대개|결국|다만)/g,
  },
  en: {
    passages: [
      "The work is not about moving faster. It is about deciding what deserves to remain, then aligning every scattered signal toward that direction.",
      "Strong outcomes rarely begin with certainty. They begin with the patience to examine a small friction until an unnamed possibility becomes clear.",
      "Polish is not the act of adding more. It is the discipline of removing everything that does not protect the central idea.",
      "We are not designing a list of features. We are designing a new rhythm of behavior, where every detail makes the next action feel inevitable.",
      "Speed is different from urgency. When the direction is precise, movement becomes lighter and unnecessary hesitation disappears.",
      "There may be no final answer yet, but there is a standard: make it simpler, make it honest, and never waste the attention of the person using it.",
      "The visible output is only one part of the work. Once the structure of the thinking is clear, the next decision becomes surprisingly easy.",
      "A small prototype can say more than a large plan. One convincing moment in motion can replace pages of explanation.",
      "Focus is not the absence of noise. It is the ability to preserve the signal that matters and translate it into form.",
      "People are rarely moved by the amount of information. They move when they feel accurately understood and can see what to do next.",
      "Every meaningful piece of work has its own temperature. Ideas survive longest when the experience is neither cold nor overly explained.",
      "We are not promising a dramatic future. We are carefully designing a tomorrow that feels more natural and slightly less exhausting.",
    ],
    hint: "Type anything",
    eyebrow: "Working draft · live",
    document: "DOCUMENT / 001",
    velocity: "Thought velocity",
    count: "keystrokes",
    aria: "Type any key to generate text",
    accents: /(work|remain|direction|possibility|central idea|behavior|standard|prototype|Focus|next|temperature|tomorrow)/gi,
    dims: /(rarely|yet|only|not)/gi,
  },
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[
        character
      ]!,
  );

export default function Home() {
  const [lang, setLang] = useState<Language>("ko");
  const [size, setSize] = useState<FontSize>("medium");
  const [rendered, setRendered] = useState("");
  const [keystrokes, setKeystrokes] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [flash, setFlash] = useState(false);
  const [ready, setReady] = useState(false);
  const surfaceRef = useRef<HTMLElement>(null);
  const languageRef = useRef<Language>("ko");
  const passageIndexRef = useRef(0);
  const textRef = useRef(content.ko.passages[0]);
  const cursorRef = useRef(0);
  const renderedRef = useRef("");
  const keystrokesRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const choosePassage = useCallback((language: Language, advance = false) => {
    const passages = content[language].passages;
    const nextIndex = advance
      ? (passageIndexRef.current +
          1 +
          Math.floor(Math.random() * (passages.length - 1))) %
        passages.length
      : Math.floor(Math.random() * passages.length);
    passageIndexRef.current = nextIndex;
    textRef.current = passages[nextIndex];
    cursorRef.current = 0;
    renderedRef.current = "";
    setRendered("");
  }, []);

  const typeBurst = useCallback(() => {
    if (!startedAtRef.current) startedAtRef.current = Date.now();

    if (cursorRef.current >= textRef.current.length) {
      choosePassage(languageRef.current, true);
    }

    const remaining = textRef.current.length - cursorRef.current;
    const random = Math.random();
    const burst = Math.min(remaining, random < 0.12 ? 3 : random < 0.42 ? 2 : 1);
    renderedRef.current += textRef.current.slice(
      cursorRef.current,
      cursorRef.current + burst,
    );
    cursorRef.current += burst;
    keystrokesRef.current += 1;
    setRendered(renderedRef.current);
    setKeystrokes(keystrokesRef.current);
    setFlash(true);

    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(false), 70);
  }, [choosePassage]);

  const deleteBit = useCallback(() => {
    if (!renderedRef.current.length) return;
    const amount = Math.min(3, renderedRef.current.length);
    renderedRef.current = renderedRef.current.slice(0, -amount);
    cursorRef.current = Math.max(0, cursorRef.current - amount);
    keystrokesRef.current += 1;
    setRendered(renderedRef.current);
    setKeystrokes(keystrokesRef.current);
  }, []);

  useEffect(() => {
    const storedLang = localStorage.getItem("deepwork-lang");
    const storedSize = localStorage.getItem("deepwork-size");
    const initialLang: Language = storedLang === "en" ? "en" : "ko";
    const initialSize: FontSize =
      storedSize === "small" || storedSize === "big" ? storedSize : "medium";
    languageRef.current = initialLang;
    setLang(initialLang);
    setSize(initialSize);
    choosePassage(initialLang);
    setReady(true);
    surfaceRef.current?.focus();
  }, [choosePassage]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.className = `size-${size}`;
  }, [lang, size]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (["Meta", "Control", "Alt", "Shift", "CapsLock", "Tab"].includes(event.key)) {
        return;
      }
      if (event.target instanceof Element && event.target.closest("button")) return;
      event.preventDefault();

      if (event.key === "Escape") {
        choosePassage(languageRef.current, true);
      } else if (event.key === "Backspace" || event.key === "Delete") {
        deleteBit();
      } else {
        typeBurst();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const interval = window.setInterval(() => {
      if (!startedAtRef.current) return;
      const minutes = Math.max((Date.now() - startedAtRef.current) / 60000, 1 / 60);
      setVelocity(Math.round(keystrokesRef.current / minutes));
    }, 1000);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.clearInterval(interval);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [choosePassage, deleteBit, typeBurst]);

  const changeLanguage = (nextLang: Language) => {
    languageRef.current = nextLang;
    localStorage.setItem("deepwork-lang", nextLang);
    setLang(nextLang);
    choosePassage(nextLang);
    surfaceRef.current?.focus();
  };

  const changeSize = (nextSize: FontSize) => {
    localStorage.setItem("deepwork-size", nextSize);
    setSize(nextSize);
    surfaceRef.current?.focus();
  };

  const styledText = useMemo(() => {
    const config = content[lang];
    return escapeHtml(rendered)
      .replace(config.accents, '<span class="accent">$1</span>')
      .replace(config.dims, '<span class="dim">$1</span>');
  }, [lang, rendered]);

  const progress = textRef.current.length
    ? Math.min(100, (cursorRef.current / textRef.current.length) * 100)
    : 0;
  const config = content[lang];

  return (
    <>
      <div className={`flash${flash ? " on" : ""}`} />
      <div className="shell">
        <header>
          <div className="brand">
            <span className="pulse" />
            Deep Work Interface
          </div>

          <div className="controls" aria-label="Display controls">
            <div className="control-group" aria-label="Font size">
              {(["small", "medium", "big"] as const).map((option) => (
                <button
                  className={`control-btn${size === option ? " active" : ""}`}
                  key={option}
                  onClick={() => changeSize(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>

            <div className="control-group" aria-label="Language">
              <button
                className={`control-btn${lang === "ko" ? " active" : ""}`}
                onClick={() => changeLanguage("ko")}
                type="button"
              >
                한글
              </button>
              <button
                className={`control-btn${lang === "en" ? " active" : ""}`}
                onClick={() => changeLanguage("en")}
                type="button"
              >
                English
              </button>
            </div>
          </div>
        </header>

        <main
          aria-label={config.aria}
          onClick={() => {
            surfaceRef.current?.focus();
            if (keystrokesRef.current === 0) typeBurst();
          }}
          ref={surfaceRef}
          tabIndex={0}
        >
          <aside className="rail">
            <span>{config.document}</span>
          </aside>

          <section className="editor">
            <div className="eyebrow">{config.eyebrow}</div>
            <div
              aria-live="polite"
              className={lang === "en" ? "lang-en" : ""}
              id="output"
            >
              <p>
                <span dangerouslySetInnerHTML={{ __html: styledText }} />
                <span className="caret" />
              </p>
            </div>
            <div className="hint" style={{ opacity: keystrokes || !ready ? 0 : 1 }}>
              <span className="key">ANY KEY</span>
              <span>{config.hint}</span>
            </div>
          </section>

          <div className="progress-wrap">
            <div id="progress" style={{ width: `${progress}%` }} />
          </div>
        </main>

        <footer>
          <span>
            {config.velocity}: <span className="count">{velocity}</span> cpm
          </span>
          <span>
            <span className="count">{keystrokes.toLocaleString()}</span>{" "}
            <span>{config.count}</span>
          </span>
        </footer>
      </div>
    </>
  );
}
