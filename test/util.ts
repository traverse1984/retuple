import { ResultLikeSymbol, type ResultLike } from "retuple-symbols";

export const ResultLikeOk: ResultLike<string, never> = {
  [ResultLikeSymbol]: () => ({ ok: true, value: "test" }),
};
export const ResultLikeErr: ResultLike<never, string> = {
  [ResultLikeSymbol]: () => ({ ok: false, value: "test" }),
};

export function capture(fn: () => any): any {
  try {
    fn();
  } catch (err) {
    return err;
  }
}

export const errThrow = new Error("Test throw error");
export const errReject = new Error("Test reject error");

export function fnThrow(): any {
  throw errThrow;
}

export async function fnReject(): Promise<any> {
  throw errReject;
}

export function mockReturnSequence<T extends ((...args: any[]) => any)[]>(
  ...impls: T
): (...args: any[]) => ReturnType<T[number]> {
  let index = 0;

  return (...args) => {
    const returns = impls[index];

    if (!returns) {
      throw new Error("Mock return sequence exhausted implementations");
    }

    index++;

    return returns(...args);
  };
}

export function trackCallTimes<T extends (...args: any[]) => any>(
  fn: T,
): { fn: T; elapsed: () => number; times: number[] } {
  const times: number[] = [];
  let firstCall = 0;
  let lastCall: number | null = null;

  return {
    times,
    elapsed: () => {
      if (firstCall === 0) {
        return 0;
      }

      return Date.now() - firstCall;
    },
    fn: ((...args: any[]) => {
      if (firstCall === 0) {
        firstCall = Date.now();
      }

      if (lastCall !== null) {
        times.push(Date.now() - lastCall);
      }

      lastCall = Date.now();

      return fn(...args);
    }) as T,
  };
}
