import { describe, test, expect } from "bun:test";
import { latexExtension, preprocessMathBlocks, KATEX_CSS } from "./latex";

describe("latex inline extension", () => {
  test("renders inline math $x^2$ as KaTeX HTML", () => {
    const { marked } = require("marked");
    marked.use({ extensions: [latexExtension] });
    const html = marked.parse("text $x^2$ text", { async: false }) as string;
    expect(html).toContain('<span class="katex">');
  });

  test("escaped \\$ outputs literal $", () => {
    const { marked } = require("marked");
    marked.use({ extensions: [latexExtension] });
    const html = marked.parse("price \\$20 each", { async: false }) as string;
    expect(html).toContain("$20");
    expect(html).not.toContain('class="katex"');
  });

  test("invalid LaTeX throws ParseError", () => {
    const { marked } = require("marked");
    marked.use({ extensions: [latexExtension] });
    expect(() =>
      marked.parse("$\\invalid$", { async: false }),
    ).toThrow();
  });
});

describe("display math preprocessor", () => {
  test("processes $$...$$ as display math KaTeX HTML", () => {
    const body = "text\n\n$$\nx^2 + y^2\n$$\n\nmore text";
    const result = preprocessMathBlocks(body);
    expect(result).toContain('<span class="katex">');
    expect(result).toContain("more text");
    expect(result).toContain("text");
  });

  test("protects code blocks from $$ matching", () => {
    const body = '```js\nconst x = $$foo$$;\n```\n\n$$\ny = z\n$$';
    const result = preprocessMathBlocks(body);
    // Code block should be preserved with $$ inside
    expect(result).toContain("$$foo$$");
    // Display math should be rendered
    expect(result).toContain('<span class="katex">');
    expect(result).toContain('```js');
  });

  test("unclosed $$ throws error", () => {
    const body = "text\n\n$$\nunclosed math";
    expect(() => preprocessMathBlocks(body)).toThrow("unclosed");
  });

  test("invalid display math LaTeX throws ParseError", () => {
    const body = "$$\n\\invalid\n$$";
    expect(() => preprocessMathBlocks(body)).toThrow();
  });
});

describe("KATEX_CSS", () => {
  test("is a non-empty string containing .katex class", () => {
    expect(typeof KATEX_CSS).toBe("string");
    expect(KATEX_CSS.length).toBeGreaterThan(100);
    expect(KATEX_CSS).toContain(".katex ");
  });
});
