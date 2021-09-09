import * as Lib from "./lib";

export default function (source: string) {
  return `export default ${JSON.stringify(
    Lib.parse_text({ abs: 0, line: 0, col: 0 }, source)
  )}`;
}
