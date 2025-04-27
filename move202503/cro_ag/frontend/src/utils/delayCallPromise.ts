const globalDelayPromiseMap: Record<
  string,
  { timer: ReturnType<typeof setTimeout>; resolve: () => void }
> = {};

export function delayCallPromise(
  key: string,
  callback: () => void | Promise<void>,
  delay = 3000
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (globalDelayPromiseMap[key]) {
      clearTimeout(globalDelayPromiseMap[key].timer);
    }

    globalDelayPromiseMap[key] = {
      timer: setTimeout(async () => {
        await callback();
        resolve();
        delete globalDelayPromiseMap[key];
      }, delay),
      resolve,
    };
  });
}
