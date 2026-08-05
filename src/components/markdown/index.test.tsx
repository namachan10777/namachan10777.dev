import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MdNode } from ".";

describe("MdNode", () => {
  it("renders void elements without dangerouslySetInnerHTML", () => {
    const markup = renderToStaticMarkup(
      <MdNode
        node={{
          type: "eager",
          tag: "hr",
          attrs: {},
          content: "",
          hash: "horizontal-rule",
        }}
      />,
    );

    expect(markup).toBe("<hr/>");
  });

  it("preserves rendered HTML for non-void eager elements", () => {
    const markup = renderToStaticMarkup(
      <MdNode
        node={{
          type: "eager",
          tag: "p",
          attrs: {},
          content: "hello <strong>world</strong>",
          hash: "paragraph",
        }}
      />,
    );

    expect(markup).toBe("<p>hello <strong>world</strong></p>");
  });
});
