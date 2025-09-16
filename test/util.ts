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
