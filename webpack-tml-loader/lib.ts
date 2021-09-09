type Text = TextElem[];

type Arg = {
  type: "text";
  text: Text;
};

type Position = {
  abs: number;
  line: number;
  col: number;
};

type Command =
  | {
      type: "simple";
      name: string;
      args: { name: string; value: Arg }[];
    }
  | {
      type: "with-text";
      name: string;
      args: { name: string; value: Arg }[];
      text: Text;
    }
  | {
      type: "with-cmds";
      name: string;
      args: { name: string; value: Arg }[];
      cmds: Command[];
    };

type ParseResult<T> =
  | {
      success: true;
      next: Position;
      result: T;
    }
  | {
      success: false;
      position: Position;
    };

type TextElem =
  | {
      type: "cmd";
      cmd: Command;
    }
  | {
      type: "plaintext";
      plaintext: string;
    };

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

export function eat_space(p: Position, src: string): ParseResult<null> {
  const white_space_length = src.match(/[ \n\t\r]*/)?.length;
  if (white_space_length) {
    const p_next = count_line_and_col(src, p, white_space_length);
    return {
      success: true,
      next: p_next,
      result: null,
    };
  } else {
    return {
      success: false,
      position: p,
    };
  }
}

export function parse(p: Position, src: string): ParseResult<Command> {
  const name = /^\\(\w+)\s*/.exec(src);
  if (name) {
    if (src.length > name[0].length && src[name[0].length] == ";") {
      return {
        success: true,
        next: count_line_and_col(src, p, name[0].length + 1),
        result: {
          type: "simple",
          name: name[1],
          args: [],
        },
      };
    }
  }
  return {
    success: false,
    position: p,
  };
}

export function hello() {
  return "Hello";
}
