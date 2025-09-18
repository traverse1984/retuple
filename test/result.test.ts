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
        Result.$resolve(
          Promise.resolve(Result.$retry(() => Ok("test")).$async()),
        ),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Result.$resolve(
          Promise.resolve(Result.$retry(() => Err("test")).$async()),
        ),
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
});
