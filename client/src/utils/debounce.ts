export function debounce<Args extends unknown[], Return>(
  fn: (...args: Args) => Return,
  delay: number
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const debouncedFn = (...args: Args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
}