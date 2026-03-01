interface DelayParams {
  timeInMs: number;
  onTimeout?: () => void;
}

async function delay({ timeInMs, onTimeout }: DelayParams): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(() => {
      onTimeout?.();
      resolve(true);
    }, timeInMs);
  });
}

export default delay;
