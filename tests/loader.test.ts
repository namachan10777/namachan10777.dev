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
})
