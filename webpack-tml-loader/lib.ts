type Text = TextElem[];

type Arg =
  | {
      type: "text";
      text: Text;
    }
  | {
      type: "int";
      int: number;
    }
  | {
      type: "float";
      float: number;
    }
  | {
      type: "string";
      str: string;
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

export function eat_space(p: Position, src: string): Position {
  const white_space_length = src.match(/[ \n\t\r]*/)?.length;
  if (white_space_length) {
    return count_line_and_col(src, p, white_space_length);
  } else {
    return p;
  }
}

function parse_value(p: Position, src: string): ParseResult<Arg> {
  const int_matched = /^\d+/.exec(src);
  // TODO: relax syntax
  const float_matched = /^\d+\.\d+/.exec(src);
  if (float_matched) {
    return {
      success: true,
      next: count_line_and_col(src, p, float_matched[0].length),
      result: {
        type: "float",
        float: parseFloat(float_matched[0]),
      },
    };
  } else if (int_matched) {
    return {
      success: true,
      next: count_line_and_col(src, p, int_matched[0].length),
      result: {
        type: "int",
        int: parseInt(int_matched[0], 10),
      },
    };
  } else if (src[0] == '"') {
    for (let i = 1; i < src.length; ++i) {
      if (
        i < src.length - 1 &&
        src[i] == "\\" &&
        /^[nrt"\\]$/.test(src[i + 1])
      ) {
        ++i;
        continue;
      }
      if (src[i] == '"') {
        return {
          success: true,
          next: count_line_and_col(src, p, i),
          result: {
            type: "string",
            str: src.slice(1, i),
          },
        };
      }
    }
  }
  return {
    success: false,
    position: p,
  };
}

function parse_arg(
  p: Position,
  src: string
): ParseResult<{ name: string; value: Arg }> {
  const argname = /^([a-zA-Z]\w*)\s*\=\s*/.exec(src);
  if (argname) {
    const p_next = count_line_and_col(src, p, argname[0].length);
    const value_result = parse_value(p_next, src.slice(argname[0].length));
    if (value_result.success) {
      return {
        ...value_result,
        result: {
          name: argname[1],
          value: value_result.result,
        },
      };
    } else {
      return value_result;
    }
  }
  return {
    success: false,
    position: p,
  };
}

export function parse(p: Position, src: string): ParseResult<Command> {
  const name = /^\\(\w+)\s*/.exec(src);
  if (name) {
    let args = [];
    let p_next = count_line_and_col(src, p, name[0].length);
    for (;;) {
      const arg_result = parse_arg(p_next, src.slice(p_next.abs - p.abs));
      if (!arg_result.success) break;
      args.push(arg_result.result);
      p_next = eat_space(arg_result.next, src.slice(arg_result.next.abs));
    }
    const closing = /^\s*;/.exec(src.slice(p_next.abs));
    if (closing) {
      return {
        success: true,
        next: count_line_and_col(
          src.slice(p_next.abs),
          p_next,
          closing[0].length
        ),
        result: {
          type: "simple",
          args,
          name: name[1],
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
