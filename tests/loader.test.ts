import "jest";

import * as Lib from "../webpack-md-loader/lib";

describe("parse", (): void => {
  const p = {
    line: 0,
    col: 0,
    abs: 0,
  };
  test("parse as raw string", (): void => {
    expect(Lib.parse(p, "Hello World!")).toStrictEqual({
      success: true,
      value: "Hello World!",
      pos: {
        line: 0,
        col: 12,
        abs: 12,
      },
    });
  });
});
