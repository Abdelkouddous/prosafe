/** Drops undefined / empty values so they are not sent as query params. */
export const cleanParams = <T extends Record<string, unknown>>(p: T) =>
  Object.fromEntries(
    Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== "")
  );

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
