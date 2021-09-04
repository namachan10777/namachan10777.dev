import 'jest'

import * as Lib from '../webpack-tml-loader/lib'

describe('greet', (): void => {
  test('should say hello.', (): void => {
    expect(Lib.hello()).toBe('Hello')
  })
})
