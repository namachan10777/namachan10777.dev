type Result<T> =
  | {
      success: true;
      value: T;
      pos: Position;
    }
  | {
      success: false;
      pos: Position;
    };

export type Position = {
  abs: number;
  line: number;
  col: number;
};

type Text = string;

function count_line_and_col(
  src: string,
  p_init: Position,
  n: number
): Position {
  let line = p_init.line;
  let col = p_init.col;
  let abs = p_init.abs;
  for (let i = 0; i < n; ++i) {
    ++abs;
    ++col;
    if (/^\n$/.test(src[i])) {
      ++line;
      col = 0;
    }
  }
  return { abs, line, col };
}

export function parse(p: Position, src: string): Result<Text> {
  return {
    success: true,
    value: src,
    pos: count_line_and_col(src, p, src.length),
  };
}
