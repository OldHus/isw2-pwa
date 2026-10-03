export type AppResult<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export function success<T>(data: T): AppResult<T, never> {
  return { success: true, data };
}

export function failure<E>(error: E): AppResult<never, E> {
  return { success: false, error };
}