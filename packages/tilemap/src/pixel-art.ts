export type PixelArt = {
  width: number;
  height: number;
  /** RGBA, row-major, 4 bytes per pixel. */
  data: Uint8ClampedArray;
};

/**
 * Character-grid canvas for authoring pixel art programmatically (fills,
 * rects, ellipses). `rows()` yields the string art that `parsePixelArt`
 * consumes, so built art and hand-written art share one pipeline.
 */
export class CharGrid {
  private readonly cells: string[][];

  constructor(
    readonly width: number,
    readonly height: number,
    fillChar = '.',
  ) {
    this.cells = Array.from({ length: height }, () =>
      new Array<string>(width).fill(fillChar),
    );
  }

  px(x: number, y: number, char: string): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.cells[y]![x] = char;
  }

  fill(x: number, y: number, w: number, h: number, char: string): void {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        this.px(xx, yy, char);
      }
    }
  }

  /** Filled ellipse centered at (cx, cy) with radii rx/ry. */
  ellipse(cx: number, cy: number, rx: number, ry: number, char: string): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          this.px(x, y, char);
        }
      }
    }
  }

  rows(): string[] {
    return this.cells.map((row) => row.join(''));
  }
}

/**
 * Maps a single character to a CSS hex color (`#rgb`, `#rrggbb`, or
 * `#rrggbbaa`). Characters absent from the palette must be `.` or a space,
 * which render transparent.
 */
export type Palette = Record<string, string>;

export function parseHexColor(
  hex: string,
): [r: number, g: number, b: number, a: number] {
  const raw = hex.startsWith('#') ? hex.slice(1) : hex;
  if (raw.length === 3) {
    const [r, g, b] = raw;
    return parseHexColor(`${r}${r}${g}${g}${b}${b}`);
  }
  if (raw.length !== 6 && raw.length !== 8) {
    throw new Error(`invalid hex color "${hex}"`);
  }
  const value = Number.parseInt(raw, 16);
  if (Number.isNaN(value)) {
    throw new Error(`invalid hex color "${hex}"`);
  }
  if (raw.length === 6) {
    return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff, 255];
  }
  return [
    (value >>> 24) & 0xff,
    (value >> 16) & 0xff,
    (value >> 8) & 0xff,
    value & 0xff,
  ];
}

/**
 * Parses string pixel art into an RGBA raster. Every row must have the same
 * length. `.` and ` ` are transparent unless remapped in the palette; any
 * other character must exist in the palette.
 */
export function parsePixelArt(rows: string[], palette: Palette): PixelArt {
  if (rows.length === 0) {
    throw new Error('pixel art needs at least one row');
  }
  const width = rows[0]!.length;
  if (width === 0) {
    throw new Error('pixel art rows must not be empty');
  }
  const height = rows.length;
  const data = new Uint8ClampedArray(width * height * 4);
  const resolved = new Map<string, [number, number, number, number] | null>();
  for (const [char, color] of Object.entries(palette)) {
    resolved.set(char, parseHexColor(color));
  }
  if (!resolved.has('.')) resolved.set('.', null);
  if (!resolved.has(' ')) resolved.set(' ', null);

  for (let y = 0; y < height; y++) {
    const row = rows[y]!;
    if (row.length !== width) {
      throw new Error(
        `pixel art row ${y} has length ${row.length}, expected ${width}`,
      );
    }
    for (let x = 0; x < width; x++) {
      const char = row[x]!;
      const rgba = resolved.get(char);
      if (rgba === undefined) {
        throw new Error(
          `pixel art row ${y} col ${x}: character "${char}" is not in the palette`,
        );
      }
      if (rgba === null) continue; // transparent
      const offset = (y * width + x) * 4;
      data[offset] = rgba[0];
      data[offset + 1] = rgba[1];
      data[offset + 2] = rgba[2];
      data[offset + 3] = rgba[3];
    }
  }
  return { width, height, data };
}
