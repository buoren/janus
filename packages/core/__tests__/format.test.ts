import { formatPrice, parsePrice } from '../src/format'

describe('formatPrice', () => {
  test('formats cents to display price', () => {
    expect(formatPrice(19500, 2)).toBe('195.00')
  })

  test('formats zero', () => {
    expect(formatPrice(0, 2)).toBe('0.00')
  })

  test('handles zero decimals', () => {
    expect(formatPrice(195, 0)).toBe('195')
  })

  test('handles 3 decimals', () => {
    expect(formatPrice(19500, 3)).toBe('19.500')
  })
})

describe('parsePrice', () => {
  test('parses display price to cents', () => {
    expect(parsePrice('195.00', 2)).toBe(19500)
  })

  test('parses empty string to 0', () => {
    expect(parsePrice('', 2)).toBe(0)
  })

  test('rounds to nearest integer', () => {
    expect(parsePrice('19.999', 2)).toBe(2000)
  })

  test('handles zero decimals', () => {
    expect(parsePrice('195', 0)).toBe(195)
  })
})
