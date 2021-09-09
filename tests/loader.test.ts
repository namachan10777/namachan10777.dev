import 'jest'

import * as Lib from '../webpack-tml-loader/lib'

describe('greet', (): void => {
  test('should say hello.', (): void => {
    expect(Lib.hello()).toBe('Hello')
  })
})

describe('parse', (): void => {
  const p = {
    line: 0,
    col: 0,
    abs: 0,
  };
  test('parse simple command', (): void => {
    expect(Lib.parse(p, "\\hoge;")).toStrictEqual({
      success: true,
      result: {
        type: 'simple',
        name: 'hoge',
        args: [],
      },
      next: {
        abs: 6,
        col: 6,
        line: 0,
      }
    });
  })
  test('parse simple command with args', (): void => {
    expect(Lib.parse(p, "\\hoge foo=1 bar=3.14 hoge=\"hoge\";")).toStrictEqual({
      success: true,
      result: {
        type: 'simple',
        name: 'hoge',
        args: [
          { name: 'foo', value: { type: 'int', int: 1 }},
          { name: 'bar', value: { type: 'float', float: 3.14 }},
          { name: 'hoge', value: { type: 'string', str: "hoge" }}
        ],
      },
      next: {
        abs: 33,
        col: 33,
        line: 0,
      }
    });
  })
})
