import { Ok, Err, ResultLikeSymbol } from "../src/index.js";

export const ResultLikeOk = { [ResultLikeSymbol]: () => Ok("test") };
export const ResultLikeErr = { [ResultLikeSymbol]: () => Err("test") };

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

export const arrayMethodsUnavailable = [
  "at",
  "concat",
  "copyWithin",
  "entries",
  "every",
  "fill",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "flat",
  "flatMap",
  "forEach",
  "includes",
  "indexOf",
  "join",
  "keys",
  "lastIndexOf",
  "map",
  "pop",
  "push",
  "reduce",
  "reduceRight",
  "reverse",
  "shift",
  "slice",
  "some",
  "sort",
  "splice",
  "toString",
  "toLocaleString",
  "toReversed",
  "toSorted",
  "toSpliced",
  "unshift",
  "values",
  "with",
] as const;

declare const __TestArrayMethods__: TestArrayMethods<
  Record<(typeof arrayMethodsUnavailable)[number], true>
>;

type TestArrayMethods<
  T extends Record<Exclude<keyof any[] & string, "length">, true>,
> = T;
