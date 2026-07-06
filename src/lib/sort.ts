/** Generic multi-field sorting for arrays of numeric-field records, e.g. leaderboard rows. */

export type SortDirection = "asc" | "desc";

export interface SortField<T> {
  key: keyof T;
  direction: SortDirection;
}

/** Builds a comparator that sorts by each field in order, falling through to the next on a tie. */
export function compareByFields<T>(fields: SortField<T>[]): (a: T, b: T) => number {
  return (a, b) => {
    for (const { key, direction } of fields) {
      const aVal = Number(a[key]);
      const bVal = Number(b[key]);
      if (aVal !== bVal) return direction === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  };
}

export function sortByFields<T>(items: T[], fields: SortField<T>[]): T[] {
  return [...items].sort(compareByFields(fields));
}
