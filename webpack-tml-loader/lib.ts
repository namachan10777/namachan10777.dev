type Text = TextElem[];

type Arg = {
  type: 'text';
  text: Text;
};

type Command =
  | {
      type: 'simple';
      name: string;
      args: { name: string; value: Arg }[];
    }
  | {
      type: 'with-text';
      name: string;
      args: { name: string; value: Arg }[];
      text: Text;
    }
  | {
      type: 'with-cmds';
      name: string;
      args: { name: string; value: Arg }[];
      cmds: Command[];
    };

type ParseResult<T> =
  | {
      success: true;
      result: T;
    }
  | {
      success: false;
      position: {
        line: number;
        col: number;
      };
    };

type TextElem =
  | {
      type: 'cmd';
      cmd: Command;
    }
  | {
      type: 'plaintext';
      plaintext: string;
    };

export function parse (_: string): ParseResult<Command> {
  return {
    success: false,
    position: {
      line: 0,
      col: 0
    }
  }
}

export function hello () {
  return 'Hello'
}
