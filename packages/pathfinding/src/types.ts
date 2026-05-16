import type { GridPosition } from '@worldkit/grid';

export type Path = GridPosition[];

export type CostFn = (position: GridPosition) => number;

export type FindPathOptions = {
  /**
   * Cost of *entering* `position`. Return a non-finite or non-positive value
   * to treat the cell as impassable. Default: `1` for every cell.
   */
  cost?: CostFn;
  /**
   * Maximum number of nodes A* may expand before giving up and returning
   * `undefined`. A safety brake for pathological worlds. Default: `10_000`.
   */
  maxNodes?: number;
};
