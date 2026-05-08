import katex from "katex";
import { readFileSync } from "fs";

// Load KaTeX CSS at module init time
export const KATEX_CSS: string = (() => {
  try {
    const path = import.meta
      .resolveSync("katex/dist/katex.min.css")
      .replace("file://", "");
    return readFileSync(path, "utf-8");
  } catch {
    return "";
  }
})();

// Escape helper for HTML attributes
function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Render a LaTeX string through KaTeX, wrapping in data-tex span
function renderMath(tex: string, display: boolean): string {
  const rendered = katex.renderToString(tex, {
    throwOnError: true,
    strict: "warn",
    displayMode: display,
  });
  const dataAttrs = display
    ? `data-tex="${escapeAttr(tex)}" data-display="true"`
    : `data-tex="${escapeAttr(tex)}"`;
  return `<span ${dataAttrs} class="katex">${rendered}</span>`;
}

export const latexExtension = {
  name: "latex",
  level: "inline" as const,
  start(src: string) {
    // Find next $, but skip \$
    let i = 0;
    while (i < src.length) {
      if (src[i] === "\\" && src[i + 1] === "$") {
        i += 2;
        continue;
      }
      if (src[i] === "$") return i;
      i++;
    }
    return -1;
  },
  tokenizer(src: string) {
    const match = src.match(/^\$([^$\n]+?)\$/);
    if (match) {
      const tex = match[1];
      return {
        type: "latex",
        raw: match[0],
        tex,
      };
    }
    // Unclosed $ or empty $$ — skip, let KaTeX throw on next parsing pass
    if (src[0] === "$") {
      // Treat as literal text to avoid infinite loop
      return undefined;
    }
  },
  renderer(token: any) {
    return renderMath(token.tex, false);
  },
};

// Preprocess $$...$$ display math blocks with code-fence protection
export function preprocessMathBlocks(body: string): string {
  const lines = body.split("\n");
  const result: string[] = [];
  let inFence = false;
  let inDisplayMath = false;
  let mathBuffer: string[] = [];

  for (const line of lines) {
    // Toggle code fence state
    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;

      // If inside display math when hitting a fence, close math
      if (inDisplayMath) {
        const tex = mathBuffer.join("\n");
        try {
          const rendered = katex.renderToString(tex, {
            throwOnError: true,
            strict: "warn",
            displayMode: true,
          });
          result.push(
            `<p><span data-tex="${escapeAttr(tex)}" class="katex">${rendered}</span></p>`
          );
        } catch (e: any) {
          throw e;
        }
        mathBuffer = [];
        inDisplayMath = false;
      }

      result.push(line);
      continue;
    }

    if (inFence) {
      result.push(line);
      continue;
    }

    // Check for $$ display math markers
    if (line.trim() === "$$") {
      if (!inDisplayMath) {
        // Opening $$
        inDisplayMath = true;
        mathBuffer = [];
      } else {
        // Closing $$
        const tex = mathBuffer.join("\n");
        try {
          const rendered = katex.renderToString(tex, {
            throwOnError: true,
            strict: "warn",
            displayMode: true,
          });
          result.push(
            `<p><span data-tex="${escapeAttr(tex)}" class="katex">${rendered}</span></p>`
          );
        } catch (e: any) {
          throw e;
        }
        mathBuffer = [];
        inDisplayMath = false;
      }
      continue;
    }

    if (inDisplayMath) {
      mathBuffer.push(line);
    } else {
      result.push(line);
    }
  }

  // Unclosed $$ — throw
  if (inDisplayMath) {
    throw new Error("LaTeX error: unclosed $$ display math block");
  }

  return result.join("\n");
}
