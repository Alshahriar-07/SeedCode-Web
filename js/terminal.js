/**
 * Interactive hero terminal: types a command, streams a scripted session
 * with pauses, progress checkmarks, and a blinking cursor, then loops.
 * Starts when scrolled into view; renders instantly under reduced motion.
 */
import { $, prefersReducedMotion } from "./utils.js";

/**
 * Each step: parts (span class + text), typing mode for the command line,
 * and the delay after the line completes.
 */
const SCRIPT = [
  { type: "cmd", text: "seedcode", delay: 700 },
  { type: "blank", delay: 200 },
  { type: "out", parts: [["t-value", "Welcome back."]], delay: 700 },
  { type: "blank", delay: 150 },
  { type: "out", parts: [["t-label", "Provider"]], delay: 250 },
  { type: "out", parts: [["t-prompt", "> "], ["t-value", "OpenRouter"]], delay: 550 },
  { type: "blank", delay: 150 },
  { type: "out", parts: [["t-label", "Model"]], delay: 250 },
  { type: "out", parts: [["t-prompt", "> "], ["t-value", "GLM 5.2"]], delay: 550 },
  { type: "blank", delay: 150 },
  { type: "out", parts: [["t-label", "Prompt"]], delay: 250 },
  {
    type: "typed-out",
    prefix: [["t-prompt", "> "]],
    text: "Build a REST API using FastAPI",
    cls: "t-value",
    delay: 600,
  },
  { type: "blank", delay: 200 },
  { type: "out", parts: [["t-dim", "Thinking..."]], delay: 1100 },
  { type: "blank", delay: 150 },
  { type: "out", parts: [["t-ok", "✓ "], ["t-value", "Planning"]], delay: 650 },
  { type: "out", parts: [["t-ok", "✓ "], ["t-value", "Writing files"]], delay: 650 },
  { type: "out", parts: [["t-ok", "✓ "], ["t-value", "Generating code"]], delay: 650 },
  { type: "out", parts: [["t-ok", "✓ "], ["t-value", "Finished"]], delay: 2600 },
];

const TYPE_MIN_MS = 34;
const TYPE_JITTER_MS = 52;
const LOOP_PAUSE_MS = 1600;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function span(cls, text) {
  const el = document.createElement("span");
  el.className = cls;
  el.textContent = text;
  return el;
}

function makeCursor() {
  const el = document.createElement("span");
  el.className = "terminal-cursor";
  el.setAttribute("aria-hidden", "true");
  return el;
}

export function initTerminal() {
  const body = $("[data-terminal]");
  if (!body) return;

  // The full transcript for screen readers; visual animation is decorative.
  body.setAttribute("aria-hidden", "false");

  let running = false;

  const scrollDown = () => {
    body.scrollTop = body.scrollHeight;
  };

  const addLine = () => {
    const line = document.createElement("div");
    line.className = "terminal-line";
    body.append(line);
    scrollDown();
    return line;
  };

  async function typeInto(line, cls, text, cursor) {
    const target = span(cls, "");
    line.insertBefore(target, cursor);
    for (const char of text) {
      target.textContent += char;
      scrollDown();
      await wait(TYPE_MIN_MS + Math.random() * TYPE_JITTER_MS);
    }
  }

  function renderInstant() {
    body.textContent = "";
    for (const step of SCRIPT) {
      const line = addLine();
      if (step.type === "cmd") {
        line.append(span("t-prompt", "$ "), span("t-cmd", step.text));
      } else if (step.type === "typed-out") {
        for (const [cls, text] of step.prefix) line.append(span(cls, text));
        line.append(span(step.cls, step.text));
      } else if (step.type === "out") {
        for (const [cls, text] of step.parts) line.append(span(cls, text));
      }
    }
    body.append(makeCursor());
  }

  async function play() {
    body.textContent = "";
    const cursor = makeCursor();

    for (const step of SCRIPT) {
      const line = addLine();
      line.append(cursor);

      if (step.type === "cmd") {
        line.insertBefore(span("t-prompt", "$ "), cursor);
        await typeInto(line, "t-cmd", step.text, cursor);
      } else if (step.type === "typed-out") {
        for (const [cls, text] of step.prefix) {
          line.insertBefore(span(cls, text), cursor);
        }
        await typeInto(line, step.cls, step.text, cursor);
      } else if (step.type === "out") {
        // Stream the whole line in quickly, token-ish
        for (const [cls, text] of step.parts) {
          const target = span(cls, "");
          line.insertBefore(target, cursor);
          for (const word of text.split(/(?<=\s)/)) {
            target.textContent += word;
            scrollDown();
            await wait(30);
          }
        }
      }

      scrollDown();
      await wait(step.delay);
    }

    await wait(LOOP_PAUSE_MS);
    if (!prefersReducedMotion()) play();
  }

  const start = () => {
    if (running) return;
    running = true;
    if (prefersReducedMotion()) {
      renderInstant();
    } else {
      play();
    }
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          start();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(body);
  } else {
    start();
  }
}
