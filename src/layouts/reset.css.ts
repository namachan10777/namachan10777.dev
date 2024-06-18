import * as layers from "./layer.css";
import { globalStyle } from "@vanilla-extract/css";

globalStyle(
  ":where(:not(html, iframe, canvas, img, svg, video, audio, svg *, symbol *))",
  {
    "@layer": {
      [layers.reset]: {
        all: "unset",
        display: "revert",
      },
    },
  },
);

globalStyle("*::before, *::after", {
  "@layer": {
    [layers.reset]: {
      boxSizing: "border-box",
    },
  },
});

globalStyle("html", {
  "@layer": {
    [layers.reset]: {
      textSizeAdjust: "none",
    },
  },
});

globalStyle("a, button", {
  "@layer": {
    [layers.reset]: {
      cursor: "revert",
    },
  },
});

globalStyle("ol, ul, menu, summary", {
  "@layer": {
    [layers.reset]: {
      listStyle: "none",
    },
  },
});

globalStyle("img", {
  "@layer": {
    [layers.reset]: {
      maxInlineSize: "100%",
      maxBlockSize: "100%",
    },
  },
});

globalStyle("table", {
  "@layer": {
    [layers.reset]: {
      borderCollapse: "collapse",
    },
  },
});

globalStyle("input, textarea", {
  "@layer": {
    [layers.reset]: {
      userSelect: "auto",
    },
  },
});

globalStyle("textarea", {
  "@layer": {
    [layers.reset]: {
      whiteSpace: "revert",
    },
  },
});

globalStyle("meter", {
  "@layer": {
    [layers.reset]: {
      appearance: "revert",
    },
  },
});

globalStyle(":where(pre)", {
  "@layer": {
    [layers.reset]: {
      all: "revert",
      boxSizing: "border-box",
    },
  },
});

globalStyle("::placeholder", {
  "@layer": {
    [layers.reset]: {
      color: "unset",
    },
  },
});

globalStyle(":where([hidden])", {
  "@layer": {
    [layers.reset]: {
      display: "none",
    },
  },
});

globalStyle(':where([contenteditable]:not([contenteditable="false"]))', {
  "@layer": {
    [layers.reset]: {
      MozUserModify: "read-write",
      WebkitUserModify: "read-write",
      overflowWrap: "break-word",
      lineBreak: "normal",
      userSelect: "auto",
    },
  },
});

globalStyle(":where(dialog:modal)", {
  "@layer": {
    [layers.reset]: {
      all: "revert",
      boxSizing: "border-box"
    },
  },
});

globalStyle("::-webkit-details-marker", {
  "@layer": {
    [layers.reset]: {
      display: "none",
    },
  },
});