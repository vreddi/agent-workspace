import { describe, expect, it } from 'vitest'
import { parseHexColor, parsePixelArt } from './pixel-art.js'

describe('parseHexColor', () => {
  it('parses #rrggbb', () => {
    expect(parseHexColor('#8fc463')).toEqual([0x8f, 0xc4, 0x63, 255])
  })

  it('parses #rgb shorthand', () => {
    expect(parseHexColor('#fff')).toEqual([255, 255, 255, 255])
  })

  it('parses #rrggbbaa with alpha', () => {
    expect(parseHexColor('#00000028')).toEqual([0, 0, 0, 0x28])
  })

  it('rejects malformed colors', () => {
    expect(() => parseHexColor('#12345')).toThrow(/invalid hex color/)
    expect(() => parseHexColor('nope')).toThrow(/invalid hex color/)
  })
})

describe('parsePixelArt', () => {
  it('maps palette characters to RGBA and defaults . to transparent', () => {
    const art = parsePixelArt(['.a', 'a.'], { a: '#ff0000' })
    expect(art.width).toBe(2)
    expect(art.height).toBe(2)
    // (0,0) transparent
    expect([...art.data.slice(0, 4)]).toEqual([0, 0, 0, 0])
    // (1,0) red
    expect([...art.data.slice(4, 8)]).toEqual([255, 0, 0, 255])
    // (0,1) red
    expect([...art.data.slice(8, 12)]).toEqual([255, 0, 0, 255])
  })

  it('rejects ragged rows', () => {
    expect(() => parsePixelArt(['aa', 'a'], { a: '#fff' })).toThrow(
      /row 1 has length 1/,
    )
  })

  it('rejects characters missing from the palette', () => {
    expect(() => parsePixelArt(['ab'], { a: '#fff' })).toThrow(
      /"b" is not in the palette/,
    )
  })

  it('allows remapping . to a color', () => {
    const art = parsePixelArt(['.'], { '.': '#010203' })
    expect([...art.data.slice(0, 4)]).toEqual([1, 2, 3, 255])
  })
})
