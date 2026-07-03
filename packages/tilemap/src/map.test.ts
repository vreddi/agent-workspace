import { describe, expect, it } from 'vitest';
import { groundAt, parseMap, propBaseCells } from './map.js';
import { COZY_TILESET } from './tiles/index.js';
import type { Legend } from './map.js';

const LEGEND: Legend = {
  '.': { kind: 'tile', tile: 'grass' },
  '#': { kind: 'tile', tile: 'path' },
  '~': { kind: 'tile', tile: 'water' },
  T: { kind: 'prop', prop: 'tree' },
  H: { kind: 'prop', prop: 'house-pink' },
  '1': { kind: 'marker', marker: 'spawn', ground: 'path' },
};

describe('parseMap', () => {
  it('parses ground, props, and markers', () => {
    const map = parseMap(
      [
        '....',
        'T.~.',
        '.#1.',
      ],
      LEGEND,
      COZY_TILESET,
    );
    expect(map.width).toBe(4);
    expect(map.height).toBe(3);
    expect(groundAt(map, 2, 1)).toBe('water');
    expect(groundAt(map, 1, 2)).toBe('path');
    // Prop and marker cells get ground fills.
    expect(groundAt(map, 0, 1)).toBe('grass');
    expect(groundAt(map, 2, 2)).toBe('path');
    expect(map.props).toEqual([{ prop: 'tree', x: 0, y: 1 }]);
    expect(map.markers).toEqual({ spawn: { x: 2, y: 2, z: 0 } });
  });

  it('rejects unknown characters', () => {
    expect(() => parseMap(['?'], LEGEND, COZY_TILESET)).toThrow(
      /"\?" is not in the legend/,
    );
  });

  it('rejects ragged rows', () => {
    expect(() => parseMap(['..', '.'], LEGEND, COZY_TILESET)).toThrow(
      /row 1 has length 1/,
    );
  });

  it('rejects props whose base does not fit', () => {
    // house-pink is 3 wide with 2 base rows; anchored at top row it sticks out.
    expect(() => parseMap(['H...'], LEGEND, COZY_TILESET)).toThrow(
      /does not fit/,
    );
    expect(() => parseMap(['....', '..H.'], LEGEND, COZY_TILESET)).toThrow(
      /does not fit/,
    );
  });

  it('rejects duplicate markers', () => {
    expect(() => parseMap(['1.1'], LEGEND, COZY_TILESET)).toThrow(
      /duplicate marker/,
    );
  });
});

describe('propBaseCells', () => {
  it('returns the blocking footprint anchored at the bottom-left', () => {
    const cells = propBaseCells({ prop: 'house-pink', x: 2, y: 3 }, COZY_TILESET);
    expect(cells).toContainEqual({ x: 2, y: 3, z: 0 });
    expect(cells).toContainEqual({ x: 4, y: 3, z: 0 });
    expect(cells).toContainEqual({ x: 2, y: 2, z: 0 });
    expect(cells).toContainEqual({ x: 4, y: 2, z: 0 });
    expect(cells).toHaveLength(6);
  });

  it('single-cell props block exactly their anchor', () => {
    expect(propBaseCells({ prop: 'tree', x: 5, y: 7 }, COZY_TILESET)).toEqual([
      { x: 5, y: 7, z: 0 },
    ]);
  });
});
