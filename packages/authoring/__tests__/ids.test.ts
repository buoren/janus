import { createIdFactory, newId } from '../src/ids'

describe('createIdFactory', () => {
  it('generates monotonic, prefixed, unique ids', () => {
    const id = createIdFactory()
    const a = id('q')
    const b = id('q')
    const c = id('opt')
    expect(a).not.toBe(b)
    expect(a.startsWith('q_')).toBe(true)
    expect(c.startsWith('opt_')).toBe(true)
    expect(new Set([a, b, c]).size).toBe(3)
  })

  it('starts each factory independently', () => {
    expect(createIdFactory(0)('q')).toBe('q_1')
    expect(typeof newId('opt')).toBe('string')
  })
})
