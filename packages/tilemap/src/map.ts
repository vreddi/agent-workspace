import type { GridPosition } from '@worldkit/grid';
import type { PropId, TileId, Tileset } from './tileset.js';

export type LegendEntry =
  | { kind: 'tile'; tile: TileId }
  | { kind: 'prop'; prop: PropId; ground?: TileId }
  | { kind: 'marker'; marker: string; ground?: TileId };

/** Maps a single map character to what it places. */
export type Legend = Record<string, LegendEntry>;

export type PropPlacement = {
  prop: PropId;
  /**
   * Anchor cell: the bottom-left cell of the prop's blocking base. The
   * visual extends `tilesHigh` rows up from here and `tilesWide` columns
   * right.
   */
  x: number;
  y: number;
};

export type TileMap = {
  width: number;
  height: number;
  /** Ground tile ids, row-major, length width * height. */
  ground: TileId[];
  props: PropPlacement[];
  /** Named cells (spawn points, doors, points of interest). */
  markers: Record<string, GridPosition>;
};

export type ParseMapOptions = {
  /** Ground tile under props and markers that don't specify one. Default `'grass'`. */
  defaultGround?: TileId;
};

export function groundAt(map: TileMap, x: number, y: number): TileId {
  return map.ground[y * map.width + x]!;
}

export function isInsideMap(map: TileMap, x: number, y: number): boolean {
  return x >= 0 && x < map.width && y >= 0 && y < map.height;
}

/**
 * Parses ASCII rows into a TileMap. Every character must appear in the
 * legend. Prop characters mark the prop's anchor (bottom-left of its base);
 * the ground beneath is filled with `ground` / `defaultGround`.
 */
export function parseMap(
  rows: string[],
  legend: Legend,
  tileset: Tileset,
  options: ParseMapOptions = {},
): TileMap {
  if (rows.length === 0) {
    throw new Error('map needs at least one row');
  }
  const width = rows[0]!.length;
  const height = rows.length;
  const defaultGround = options.defaultGround ?? 'grass';
  const ground: TileId[] = new Array(width * height);
  const props: PropPlacement[] = [];
  const markers: Record<string, GridPosition> = {};

  const resolveTile = (tile: TileId, where: string): TileId => {
    if (!tileset.tiles[tile]) {
      throw new Error(`${where}: tile "${tile}" is not in the tileset`);
    }
    return tile;
  };

  for (let y = 0; y < height; y++) {
    const row = rows[y]!;
    if (row.length !== width) {
      throw new Error(`map row ${y} has length ${row.length}, expected ${width}`);
    }
    for (let x = 0; x < width; x++) {
      const char = row[x]!;
      const entry = legend[char];
      if (!entry) {
        throw new Error(
          `map row ${y} col ${x}: character "${char}" is not in the legend`,
        );
      }
      const where = `map row ${y} col ${x}`;
      switch (entry.kind) {
        case 'tile':
          ground[y * width + x] = resolveTile(entry.tile, where);
          break;
        case 'prop': {
          ground[y * width + x] = resolveTile(
            entry.ground ?? defaultGround,
            where,
          );
          const def = tileset.props[entry.prop];
          if (!def) {
            throw new Error(`${where}: prop "${entry.prop}" is not in the tileset`);
          }
          if (x + def.tilesWide > width || y - def.baseRows + 1 < 0) {
            throw new Error(
              `${where}: prop "${entry.prop}" base does not fit inside the map`,
            );
          }
          props.push({ prop: entry.prop, x, y });
          break;
        }
        case 'marker': {
          ground[y * width + x] = resolveTile(
            entry.ground ?? defaultGround,
            where,
          );
          if (markers[entry.marker]) {
            throw new Error(`${where}: duplicate marker "${entry.marker}"`);
          }
          markers[entry.marker] = { x, y, z: 0 };
          break;
        }
      }
    }
  }
  return { width, height, ground, props, markers };
}

/** Every cell covered by the prop's blocking base, given its placement. */
export function propBaseCells(
  placement: PropPlacement,
  tileset: Tileset,
): GridPosition[] {
  const def = tileset.props[placement.prop];
  if (!def) {
    throw new Error(`prop "${placement.prop}" is not in the tileset`);
  }
  const cells: GridPosition[] = [];
  for (let row = 0; row < def.baseRows; row++) {
    for (let col = 0; col < def.tilesWide; col++) {
      cells.push({ x: placement.x + col, y: placement.y - row, z: 0 });
    }
  }
  return cells;
}
