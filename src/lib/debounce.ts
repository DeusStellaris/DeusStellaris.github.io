/** Agrupa llamadas seguidas: ejecuta la función una sola vez, `waitMs` después de la última. */
export function debounce<Args extends unknown[]>(
  callback: (...args: Args) => void,
  waitMs: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), waitMs);
  };
}
