export type AppResult<T, E> = { success: true; data: T } | { success: false; error: E };

export function ok<T, E = never>(data: T): AppResult<T, E> {
  return { success: true, data };
}

export function err<E, T = never>(error: E): AppResult<T, E> {
  return { success: false, error };
}