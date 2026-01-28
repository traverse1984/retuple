import { vi, describe, it, expect } from "vitest";

import {
  ResultLikeOk,
  ResultLikeErr,
  capture,
  errThrow,
  errReject,
  fnThrow,
  fnReject,
} from "./util.js";

import {
  Result,
  Ok,
  Err,
  RetupleCaughtValueError,
  RetupleInvalidUnionError,
} from "../src/index.js";

describe("Result", () => {
  it("should alias Result.$from and return itself when the result is `Ok`", () => {
    const result = Ok("test");

    expect(Result(result)).toBe(result);
  });

  it("should alias Result.$from and return itself when the result is `Err`", () => {
    const result = Err("test");

    expect(Result(result)).toBe(result);
  });

  it("should alias Result.$from and return the result obtained from calling ResultLikeSymbol", () => {
    expect(Result(ResultLikeOk)).toStrictEqual(Ok("test"));
    expect(Result(ResultLikeErr)).toStrictEqual(Err("test"));
  });

  describe("$from", () => {
    it("should return itself when the result is `Ok`", () => {
      const result = Ok("test");

      expect(Result.$from(result)).toBe(result);
    });

    it("should return itself when the result is `Err`", () => {
      const result = Err("test");

      expect(Result.$from(result)).toBe(result);
    });

    it("should return the result obtained from calling ResultLikeSymbol", () => {
      expect(Result.$from(ResultLikeOk)).toStrictEqual(Ok("test"));
      expect(Result.$from(ResultLikeErr)).toStrictEqual(Err("test"));
    });
  });

  describe("$resolve", () => {
    it("should resolve to ResultAsync when the result is Ok", async () => {
      await expect(Result.$resolve(Ok("test"))).resolves.toStrictEqual(
        Ok("test"),
      );
    });

    it("should resolve to ResultAsync when the result is Err", async () => {
      await expect(Result.$resolve(Err("test"))).resolves.toStrictEqual(
        Err("test"),
      );
    });

    it("should return itself when the result is ResultAsync", () => {
      const result = Ok("test").$async();

      expect(Result.$resolve(result)).toBe(result);
    });

    it("should resolve to Result when the result is ResultRetry", async () => {
      await expect(
        Result.$resolve(Result.$retry(() => Ok("test"))),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve(Result.$retry(() => Err("test"))),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should resolve to Result when the result is a Promise of Result", async () => {
      await expect(
        Result.$resolve(Promise.resolve(Ok("test"))),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve(Promise.resolve(Err("test"))),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should resolve to Result when the result is a Promise of ResultAsync", async () => {
      await expect(
        Result.$resolve(Promise.resolve(Ok("test").$async())),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Result when the result is a Promise of ResultRetry", async () => {
      await expect(
        Result.$resolve(Promise.resolve(Result.$retry(() => Ok("test")))),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve(Promise.resolve(Result.$retry(() => Err("test")))),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should resolve to Result when the result is a thenable of Result", async () => {
      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) => resolve(Ok("test")),
        }),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) => resolve(Err("test")),
        }),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should resolve to Result when the result is a thenable of ResultAsync", async () => {
      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) =>
            resolve(Ok("test").$async()),
        }),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) => resolve(Err("test")),
        }),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should resolve to Result when the result is a thenable of ResultRetry", async () => {
      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) =>
            resolve(Result.$retry(() => Ok("test"))),
        }),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) =>
            resolve(Result.$retry(() => Err("test"))),
        }),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should resolve to Result when the result has the ResultLikeSymbol function", async () => {
      await expect(Result.$resolve(ResultLikeOk)).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(Result.$resolve(ResultLikeErr)).resolves.toStrictEqual(
        Err("test"),
      );
    });

    it("should resolve to Result when the result is a Promise of an object with a ResultLikeSymbol function", async () => {
      await expect(
        Result.$resolve(Promise.resolve(ResultLikeOk)),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve(Promise.resolve(ResultLikeErr)),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should resolve to Result when the result is a thenable of an object with a ResultLikeSymbol function", async () => {
      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) => resolve(ResultLikeOk),
        }),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve({
          then: (resolve: (...args: any[]) => any) => resolve(ResultLikeErr),
        }),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$nonNullable", () => {
    it("should not invoke the error function when the from value is neither null or undefined", () => {
      const fnMapError = vi.fn(() => {});

      Result.$nonNullable(false, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();
    });

    it("should invoke the error function with no arguments when the from value is null or undefined", () => {
      const fnMapError = vi.fn(() => {});

      Result.$nonNullable(null, fnMapError);
      expect(fnMapError).toHaveBeenNthCalledWith(1);

      Result.$nonNullable(undefined, fnMapError);
      expect(fnMapError).toHaveBeenNthCalledWith(2);
    });

    it("should throw the when the error function throws, and when the from value is null or undefined", () => {
      expect(capture(() => Result.$nonNullable(null, fnThrow))).toBe(errThrow);
      expect(capture(() => Result.$nonNullable(undefined, fnThrow))).toBe(
        errThrow,
      );
    });

    it("should return Ok with the from value when the from value is neither null or undefined", () => {
      expect(Result.$nonNullable(false)).toStrictEqual(Ok(false));
      expect(Result.$nonNullable("")).toStrictEqual(Ok(""));
    });

    it("should return Err with true when the from value is null or undefined", () => {
      expect(Result.$nonNullable(null)).toStrictEqual(Err(true));
      expect(Result.$nonNullable(undefined)).toStrictEqual(Err(true));
    });

    it("should return Err with the error value when the from value is null or undefined, and the error function is provided", () => {
      expect(Result.$nonNullable(null, () => "test")).toStrictEqual(
        Err("test"),
      );
      expect(Result.$nonNullable(undefined, () => "test")).toStrictEqual(
        Err("test"),
      );
    });
  });

  describe("$truthy", () => {
    it("should not invoke the error function when the from value is truthy", () => {
      const fnMapError = vi.fn(() => {});

      Result.$truthy(true, fnMapError);
      Result.$truthy("truthy", fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();
    });

    it("should invoke the error function with no arguments when the from value is falsey", () => {
      const fnMapError = vi.fn(() => {});

      Result.$truthy(false, fnMapError);
      expect(fnMapError).toHaveBeenNthCalledWith(1);

      Result.$truthy("", fnMapError);
      expect(fnMapError).toHaveBeenNthCalledWith(2);
    });

    it("should throw the when the error function throws, and when the from value is falsey", () => {
      expect(capture(() => Result.$truthy(undefined, fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the from value when the from value is truthy", () => {
      expect(Result.$truthy(true)).toStrictEqual(Ok(true));
      expect(Result.$truthy("truthy")).toStrictEqual(Ok("truthy"));
    });

    it("should return Err with true when the from value is falsey", () => {
      expect(Result.$truthy(false)).toStrictEqual(Err(true));
      expect(Result.$truthy("")).toStrictEqual(Err(true));
    });

    it("should return Err with the error value when the from value is falsey, and the error function is provided", () => {
      expect(Result.$truthy(undefined, () => "test")).toStrictEqual(
        Err("test"),
      );
    });
  });

  describe("$fromUnion", () => {
    it("should return Ok with the data value when the success property is true", () => {
      expect(Result.$fromUnion({ success: true, data: "test" })).toStrictEqual(
        Ok("test"),
      );
    });

    it("should return Err with the error value when the success property is false", () => {
      expect(
        Result.$fromUnion({ success: false, error: "test" }),
      ).toStrictEqual(Err("test"));
    });

    it("should throw RetupleInvalidUnionError when the success property is not boolean", () => {
      const invalid = {
        success: "invalid",
        data: "data",
        error: "error",
      };

      expect(capture(() => Result.$fromUnion(invalid as any))).toStrictEqual(
        new RetupleInvalidUnionError(invalid),
      );
    });
  });

  describe("$safe", () => {
    it("should invoke the safe function with no arguments", () => {
      const fnSafe = vi.fn(() => {});

      Result.$safe(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith();
    });

    it("should invoke the map error function with the thrown value when the safe function throws", () => {
      const fnMapError = vi.fn(() => {});

      Result.$safe(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should return Ok with the safe value", () => {
      expect(Result.$safe(() => "test")).toStrictEqual(Ok("test"));
    });

    it("should return Err with the thrown error when the safe function throws", () => {
      expect(Result.$safe(fnThrow)).toStrictEqual(Err(errThrow));
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", () => {
      expect(
        Result.$safe(() => {
          throw "test";
        }),
      ).toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error using the map error function when provided", () => {
      expect(Result.$safe(fnThrow, () => "test")).toStrictEqual(Err("test"));
    });
  });

  describe("$safeAsync", () => {
    it("should invoke the safe function with no arguments", async () => {
      const fnSafe = vi.fn(() => {});

      await Result.$safeAsync(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith();
    });

    it("should invoke the map error function with the thrown value when the safe function throws", async () => {
      const fnMapError = vi.fn(() => {});

      await Result.$safeAsync(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should invoke the map error function with the reject value when the safe function rejects", async () => {
      const fnMapError = vi.fn(() => {});

      await Result.$safeAsync(fnReject, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Result.$safeAsync(fnReject, fnThrow)).rejects.toBe(errThrow);
    });

    it("should resolve to Ok with the safe value", async () => {
      await expect(Result.$safeAsync(() => "test")).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(
        Result.$safeAsync(async () => "test"),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err with the thrown/rejected error when the safe function throws or rejects", async () => {
      await expect(Result.$safeAsync(fnThrow)).resolves.toStrictEqual(
        Err(errThrow),
      );

      await expect(Result.$safeAsync(fnReject)).resolves.toStrictEqual(
        Err(errReject),
      );
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Result.$safeAsync(() => {
          throw "test";
        }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));

      await expect(
        Result.$safeAsync(async () => {
          throw "test";
        }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error using the map error function when provided", async () => {
      await expect(
        Result.$safeAsync(fnThrow, () => "test"),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Result.$safeAsync(fnReject, () => "test"),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$safePromise", () => {
    it("should invoke the map error function with the rejected value when the promise rejects", async () => {
      const fnMapError = vi.fn(() => {});
      const rejected = fnReject();

      await Result.$safePromise(rejected, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Result.$safePromise(fnReject(), fnThrow)).rejects.toBe(
        errThrow,
      );
    });

    it("Resolves to Ok with the safe value", async () => {
      await expect(
        Result.$safePromise(Promise.resolve("test")),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("Resolves to Err with the rejected value when the promise rejects", async () => {
      await expect(Result.$safePromise(fnReject())).resolves.toStrictEqual(
        Err(errReject),
      );
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Result.$safePromise(Promise.reject("test")),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error with the map error function when provided", async () => {
      await expect(
        Result.$safePromise(fnReject(), () => "test"),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$safeRetry", () => {
    it("should invoke the safe function with no arguments", async () => {
      const fnSafe = vi.fn(() => {});

      await Result.$safeRetry(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith();
    });

    it("should invoke the map error function with the thrown value when the safe function throws", async () => {
      const fnMapError = vi.fn(() => {});

      await Result.$safeRetry(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should invoke the map error function with the reject value when the safe function rejects", async () => {
      const fnMapError = vi.fn(() => {});

      await Result.$safeRetry(fnReject, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Result.$safeRetry(fnReject, fnThrow)).rejects.toBe(errThrow);
    });

    it("should return ResultRetry", () => {
      const prototype = Object.getPrototypeOf(Result.$retry(() => Ok("test")));

      expect(Result.$safeRetry(() => "test")).toBeInstanceOf(
        prototype.constructor,
      );
    });

    it("should resolve to Ok with the safe value", async () => {
      await expect(Result.$safeRetry(() => "test")).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(
        Result.$safeRetry(async () => "test"),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err with the thrown/rejected error when the safe function throws or rejects", async () => {
      await expect(Result.$safeRetry(fnThrow)).resolves.toStrictEqual(
        Err(errThrow),
      );

      await expect(Result.$safeRetry(fnReject)).resolves.toStrictEqual(
        Err(errReject),
      );
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Result.$safeRetry(() => {
          throw "test";
        }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));

      await expect(
        Result.$safeRetry(async () => {
          throw "test";
        }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error using the map error function when provided", async () => {
      await expect(
        Result.$safeRetry(fnThrow, () => "test"),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Result.$safeRetry(fnReject, () => "test"),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$all", () => {
    it("should return Ok containing a tuple of values when all elements are Ok", () => {
      expect(Result.$all([Ok(1), Ok(2), Ok(3)])).toStrictEqual(Ok([1, 2, 3]));
    });

    it("should return Err containing the first Err value", () => {
      expect(
        Result.$all([Ok(1), Err("test"), Ok(2), Err("test2")]),
      ).toStrictEqual(Err("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(Result.$all([ResultLikeOk])).toStrictEqual(Ok(["test"]));

      expect(Result.$all([ResultLikeOk, ResultLikeErr])).toStrictEqual(
        Err("test"),
      );
    });
  });

  describe("$allPromised", () => {
    it("should reject when any element rejects", async () => {
      await expect(
        Result.$allPromised([Ok(1).$async(), Promise.reject(errReject), Ok(3)]),
      ).rejects.toBe(errReject);
    });

    it("should resolve to Ok containing a tuple of values when all elements resolve to Ok", async () => {
      await expect(
        Result.$allPromised([Ok(1).$async(), Promise.resolve(Ok(2)), Ok(3)]),
      ).resolves.toStrictEqual(Ok([1, 2, 3]));
    });

    it("should resolve to Err containing the first resolved Err", async () => {
      await expect(
        Result.$allPromised([
          Ok(1).$async(),
          Err("test"),
          Ok(2),
          Err("test2").$async(),
        ]),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Result.$allPromised([
          Ok(1).$async(),
          Err("test").$async(),
          Ok(2),
          Err("test2"),
        ]),
      ).resolves.toStrictEqual(Err("test2"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(Result.$allPromised([ResultLikeOk])).resolves.toStrictEqual(
        Ok(["test"]),
      );

      await expect(
        Result.$allPromised([ResultLikeOk, ResultLikeErr]),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Result.$allPromised([Promise.resolve(ResultLikeOk)]),
      ).resolves.toStrictEqual(Ok(["test"]));

      await expect(
        Result.$allPromised([
          Promise.resolve(ResultLikeOk),
          Promise.resolve(ResultLikeErr),
        ]),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$any", () => {
    it("should return Ok containing the first Ok value", () => {
      expect(Result.$any([Err(1), Ok(2), Err(3), Ok(4)])).toStrictEqual(Ok(2));
    });

    it("should return Err containing a tuple of values when all elements are Err", () => {
      expect(Result.$any([Err(1), Err(2), Err(3)])).toStrictEqual(
        Err([1, 2, 3]),
      );
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(Result.$any([ResultLikeOk, ResultLikeErr])).toStrictEqual(
        Ok("test"),
      );

      expect(Result.$any([ResultLikeErr])).toStrictEqual(Err(["test"]));
    });
  });

  describe("$anyPromised", () => {
    it("should reject with AggregateError when one or more elements reject, and when all other elements resolve to Err", async () => {
      await expect(
        Result.$anyPromised([
          Err(1),
          Promise.reject(errReject),
          Err(2).$async(),
        ]),
      ).rejects.toBeInstanceOf(AggregateError);

      await expect(
        Result.$anyPromised([
          Err(1),
          Promise.reject(errReject),
          Err(2).$async(),
        ]),
      ).rejects.toStrictEqual(
        expect.objectContaining({ errors: [1, errReject, 2] }),
      );
    });

    it("should resolve to Ok containing the first resolved Ok", async () => {
      await expect(
        Result.$anyPromised([Ok(1), Ok(2).$async()]),
      ).resolves.toStrictEqual(Ok(1));

      await expect(
        Result.$anyPromised([Ok(1).$async(), Ok(2)]),
      ).resolves.toStrictEqual(Ok(2));
    });

    it("should resolve to Ok containing the first resolved Ok even when an element rejects", async () => {
      await expect(
        Result.$anyPromised([Promise.reject(errReject), Ok(1).$async()]),
      ).resolves.toStrictEqual(Ok(1));
    });

    it("should resolve to Err containing a tuple of values when all elements resolve to Err", async () => {
      await expect(
        Result.$anyPromised([Err(1).$async(), Promise.resolve(Err(2)), Err(3)]),
      ).resolves.toStrictEqual(Err([1, 2, 3]));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(
        Result.$anyPromised([ResultLikeOk, ResultLikeErr]),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(Result.$anyPromised([ResultLikeErr])).resolves.toStrictEqual(
        Err(["test"]),
      );

      await expect(
        Result.$anyPromised([
          Promise.resolve(ResultLikeOk),
          Promise.resolve(ResultLikeErr),
        ]),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$anyPromised([Promise.resolve(ResultLikeErr)]),
      ).resolves.toStrictEqual(Err(["test"]));
    });
  });

  describe("$collect", () => {
    it("should return Ok containing an object of values when all values are Ok", () => {
      expect(
        Result.$collect({ test1: Ok(1), test2: Ok(2), test3: Ok(3) }),
      ).toStrictEqual(Ok({ test1: 1, test2: 2, test3: 3 }));
    });

    it("should return Err containing the first Err value", () => {
      expect(
        Result.$collect({
          test1: Ok(1),
          test2: Err("test2"),
          test3: Err("test3"),
        }),
      ).toStrictEqual(Err("test2"));
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(Result.$collect({ ok: ResultLikeOk })).toStrictEqual(
        Ok({ ok: "test" }),
      );

      expect(
        Result.$collect({ ok: ResultLikeOk, err: ResultLikeErr }),
      ).toStrictEqual(Err("test"));
    });
  });

  describe("$collectPromised", () => {
    it("should reject when any element rejects", async () => {
      await expect(
        Result.$collectPromised({
          test1: Ok(1),
          test2: Promise.reject(errReject),
          test3: Ok(3),
        }),
      ).rejects.toBe(errReject);
    });

    it("should resolve to Ok containing an object of values when all values resolve to Ok", async () => {
      await expect(
        Result.$collectPromised({
          test1: Ok(1),
          test2: Promise.resolve(Ok(2)),
          test3: Ok(3).$async(),
        }),
      ).resolves.toStrictEqual(Ok({ test1: 1, test2: 2, test3: 3 }));
    });

    it("should resolve to Err containing the first resolved Err value", async () => {
      await expect(
        Result.$collectPromised({
          test1: Ok(1).$async(),
          test2: Err("test2"),
          test3: Err("test3").$async(),
        }),
      ).resolves.toStrictEqual(Err("test2"));

      await expect(
        Result.$collectPromised({
          test1: Ok(1).$async(),
          test2: Err("test2").$async(),
          test3: Err("test3"),
        }),
      ).resolves.toStrictEqual(Err("test3"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(
        Result.$collectPromised({ ok: ResultLikeOk }),
      ).resolves.toStrictEqual(Ok({ ok: "test" }));

      await expect(
        Result.$collectPromised({ ok: ResultLikeOk, err: ResultLikeErr }),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Result.$collectPromised({ ok: Promise.resolve(ResultLikeOk) }),
      ).resolves.toStrictEqual(Ok({ ok: "test" }));

      await expect(
        Result.$collectPromised({
          ok: Promise.resolve(ResultLikeOk),
          err: Promise.resolve(ResultLikeErr),
        }),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$pipe", () => {
    it("should throw if any provided function throws", () => {
      const fnNoop = () => Ok();

      expect(() => Result.$pipe(fnNoop, fnThrow)).toThrow(errThrow);
      expect(() => Result.$pipe(fnNoop, fnNoop, fnThrow)).toThrow(errThrow);
      expect(() => Result.$pipe(fnNoop, fnNoop, fnNoop, fnThrow)).toThrow(
        errThrow,
      );
      expect(() =>
        Result.$pipe(fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).toThrow(errThrow);
      expect(() =>
        Result.$pipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).toThrow(errThrow);
      expect(() =>
        Result.$pipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).toThrow(errThrow);
      expect(() =>
        Result.$pipe(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnThrow,
        ),
      ).toThrow(errThrow);
    });

    it("should invoke each function in sequence and pass the previous ok value to the next function", () => {
      const fnPipe = vi.fn((val?: number) => Ok(val ? val + 1 : 1));

      Result.$pipe(
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
      );

      expect(fnPipe).toHaveBeenNthCalledWith(1);
      expect(fnPipe).toHaveBeenNthCalledWith(2, 1);
      expect(fnPipe).toHaveBeenNthCalledWith(3, 2);
      expect(fnPipe).toHaveBeenNthCalledWith(4, 3);
      expect(fnPipe).toHaveBeenNthCalledWith(5, 4);
      expect(fnPipe).toHaveBeenNthCalledWith(6, 5);
      expect(fnPipe).toHaveBeenNthCalledWith(7, 6);
      expect(fnPipe).toHaveBeenNthCalledWith(8, 7);

      expect(fnPipe).toHaveNthReturnedWith(1, Ok(1));
      expect(fnPipe).toHaveNthReturnedWith(2, Ok(2));
      expect(fnPipe).toHaveNthReturnedWith(3, Ok(3));
      expect(fnPipe).toHaveNthReturnedWith(4, Ok(4));
      expect(fnPipe).toHaveNthReturnedWith(5, Ok(5));
      expect(fnPipe).toHaveNthReturnedWith(6, Ok(6));
      expect(fnPipe).toHaveNthReturnedWith(7, Ok(7));
      expect(fnPipe).toHaveNthReturnedWith(8, Ok(8));
    });

    it("should return the first returned Err encountered", () => {
      const fnNoop = () => Ok();
      const fnErr = () => Err("test");

      expect(Result.$pipe(fnErr, fnNoop)).toStrictEqual(Err("test"));
      expect(Result.$pipe(fnNoop, fnErr)).toStrictEqual(Err("test"));
      expect(Result.$pipe(fnNoop, fnNoop, fnErr)).toStrictEqual(Err("test"));
      expect(Result.$pipe(fnNoop, fnNoop, fnNoop, fnErr)).toStrictEqual(
        Err("test"),
      );
      expect(Result.$pipe(fnNoop, fnNoop, fnNoop, fnNoop, fnErr)).toStrictEqual(
        Err("test"),
      );
      expect(
        Result.$pipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).toStrictEqual(Err("test"));
      expect(
        Result.$pipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).toStrictEqual(Err("test"));
      expect(
        Result.$pipe(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnErr,
        ),
      ).toStrictEqual(Err("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(
        Result.$pipe(
          () => Ok(),
          () => ResultLikeOk,
        ),
      ).toStrictEqual(Ok("test"));

      expect(
        Result.$pipe(
          () => Ok(),
          () => ResultLikeErr,
        ),
      ).toStrictEqual(Err("test"));
    });
  });

  describe("$pipeAsync", () => {
    it("should reject if any provided function throws", async () => {
      const fnNoop = () => Ok();

      await expect(Result.$pipeAsync(fnNoop, fnThrow)).rejects.toBe(errThrow);
      await expect(Result.$pipeAsync(fnNoop, fnNoop, fnThrow)).rejects.toBe(
        errThrow,
      );
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Result.$pipeAsync(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnThrow,
        ),
      ).rejects.toBe(errThrow);
      await expect(
        Result.$pipeAsync(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnThrow,
        ),
      ).rejects.toBe(errThrow);
    });

    it("should reject if any provided function rejects", async () => {
      const fnNoop = () => Ok();

      await expect(Result.$pipeAsync(fnNoop, fnReject)).rejects.toBe(errReject);
      await expect(Result.$pipeAsync(fnNoop, fnNoop, fnReject)).rejects.toBe(
        errReject,
      );
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Result.$pipeAsync(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnReject,
        ),
      ).rejects.toBe(errReject);
      await expect(
        Result.$pipeAsync(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnReject,
        ),
      ).rejects.toBe(errReject);
    });

    it("should resolve each function in sequence and pass the previous ok value to the next function", async () => {
      const fnPipe = vi.fn((val?: number) => Ok(val ? val + 1 : 1).$async());

      await Result.$pipeAsync(
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
      );

      expect(fnPipe).toHaveBeenNthCalledWith(1);
      expect(fnPipe).toHaveBeenNthCalledWith(2, 1);
      expect(fnPipe).toHaveBeenNthCalledWith(3, 2);
      expect(fnPipe).toHaveBeenNthCalledWith(4, 3);
      expect(fnPipe).toHaveBeenNthCalledWith(5, 4);
      expect(fnPipe).toHaveBeenNthCalledWith(6, 5);
      expect(fnPipe).toHaveBeenNthCalledWith(7, 6);
      expect(fnPipe).toHaveBeenNthCalledWith(8, 7);

      expect(fnPipe).toHaveNthReturnedWith(1, Ok(1).$async());
      expect(fnPipe).toHaveNthReturnedWith(2, Ok(2).$async());
      expect(fnPipe).toHaveNthReturnedWith(3, Ok(3).$async());
      expect(fnPipe).toHaveNthReturnedWith(4, Ok(4).$async());
      expect(fnPipe).toHaveNthReturnedWith(5, Ok(5).$async());
      expect(fnPipe).toHaveNthReturnedWith(6, Ok(6).$async());
      expect(fnPipe).toHaveNthReturnedWith(7, Ok(7).$async());
      expect(fnPipe).toHaveNthReturnedWith(8, Ok(8).$async());
    });

    it("should resolve with the first returned Err encountered", async () => {
      const fnNoop = () => Ok().$async();
      const fnErr = () => Err("test").$async();

      await expect(Result.$pipeAsync(fnErr, fnNoop)).resolves.toStrictEqual(
        Err("test"),
      );
      await expect(Result.$pipeAsync(fnNoop, fnErr)).resolves.toStrictEqual(
        Err("test"),
      );
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Result.$pipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Result.$pipeAsync(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnErr,
        ),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Result.$pipeAsync(
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnNoop,
          fnErr,
        ),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(
        Result.$pipeAsync(
          () => Ok().$async(),
          () => ResultLikeOk,
        ),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$pipeAsync(
          () => Ok().$async(),
          () => ResultLikeErr,
        ),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Result.$pipeAsync(
          async () => Ok(),
          async () => ResultLikeOk,
        ),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$pipeAsync(
          async () => Ok(),
          async () => ResultLikeErr,
        ),
      ).resolves.toStrictEqual(Err("test"));
    });
  });
});
