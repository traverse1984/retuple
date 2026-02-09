import { vi, describe, it, expect } from "vitest";
import { ResultLikeSymbol } from "retuple-symbols";

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
  RetupleUnwrapErrFailed,
  RetupleCaughtValueError,
  RetupleAssertFailed,
  RetupleFilterFailed,
  RetupleIndexFailed,
} from "../src/index.js";

describe("Ok", () => {
  it("should be an instance of Array", () => {
    expect(Ok()).toBeInstanceOf(Array);
  });

  it("should have two elements", () => {
    expect(Ok().length).toBe(2);
  });

  it("should have undefined at index 0", () => {
    expect(Ok("test")[0]).toBe(undefined);
  });

  it("should have the contained value at index 1", () => {
    expect(Ok("test")[1]).toBe("test");
  });

  it("should use undefined as the contained value when constructed without arguments", () => {
    expect(Ok()[1]).toBe(undefined);
  });

  it("should return ResultLikeOk when ResultLikeSymbol is called", () => {
    expect(Ok("test")[ResultLikeSymbol]()).toStrictEqual({
      ok: true,
      value: "test",
    });
  });

  it("should JSON stringify to the JSON representation of the contained value", () => {
    expect(JSON.stringify(Ok())).toBe(JSON.stringify(undefined));
    expect(JSON.stringify(Ok(null))).toBe(JSON.stringify(null));
    expect(JSON.stringify(Ok(NaN))).toBe(JSON.stringify(NaN));
    expect(JSON.stringify(Ok("test"))).toBe(JSON.stringify("test"));
    expect(JSON.stringify(Ok([1, 2, 3]))).toBe(JSON.stringify([1, 2, 3]));
    expect(JSON.parse(JSON.stringify(Ok({ a: 1, b: 2 })))).toStrictEqual(
      JSON.parse(JSON.stringify({ a: 1, b: 2 })),
    );
  });

  describe("$isOk", () => {
    it("should return true", () => {
      expect(Ok().$isOk()).toBe(true);
    });
  });

  describe("$isOkAnd", () => {
    it("should invoke the predicate/condition function with the contained value", () => {
      const fnCond = vi.fn(() => {});

      Ok("test").$isOkAnd(fnCond);

      expect(fnCond).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the predicate/condition function throws", () => {
      expect(capture(() => Ok().$isOkAnd(fnThrow))).toBe(errThrow);
    });

    it("should return true when the predicate/condition function returns a truthy value", () => {
      expect(Ok("test").$isOkAnd((val) => val === "test")).toBe(true);
      expect(Ok().$isOkAnd(() => "truthy")).toBe(true);
    });

    it("should return false when the predicate/condition function returns a falsey value", () => {
      expect(Ok<string>("test").$isOkAnd((val) => val !== "test")).toBe(false);
      expect(Ok().$isOkAnd(() => "")).toBe(false);
    });
  });

  describe("$isErr", () => {
    it("should return false", () => {
      expect(Ok().$isErr()).toBe(false);
    });
  });

  describe("$isErrAnd", () => {
    it("should not invoke the predicate/condition function", () => {
      const fnCond = vi.fn(() => {});

      Ok().$isErrAnd(fnCond);

      expect(fnCond).not.toHaveBeenCalled();
    });

    it("should return false", () => {
      expect(Ok().$isErrAnd(() => true)).toBe(false);
    });
  });

  describe("$expect", () => {
    it("should return the contained value", () => {
      expect(Ok("test").$expect()).toBe("test");
    });
  });

  describe("$unwrap", () => {
    it("should return the contained value", () => {
      expect(Ok("test").$unwrap()).toBe("test");
    });
  });

  describe("$unwrapErr", () => {
    it("should throw RetupleUnwrapErrFailed", () => {
      expect(() => Ok().$unwrapErr()).toThrow(RetupleUnwrapErrFailed);
    });

    it("should include the contained value on the thrown RetupleUnwrapErrFailed", () => {
      expect(() => Ok("test").$unwrapErr()).toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });

    it("should use the custom error message for the thrown RetupleUnwrapErrFailed when provided", () => {
      expect(() => Ok().$unwrapErr("Test error message")).toThrow(
        "Test error message",
      );
    });
  });

  describe("$unwrapOr", () => {
    it("should return the contained value", () => {
      expect(Ok("test").$unwrapOr("default")).toBe("test");
    });
  });

  describe("$unwrapOrElse", () => {
    it("should not invoke the default function", () => {
      const fnDefault = vi.fn(() => {});

      Ok().$unwrapOrElse(fnDefault);

      expect(fnDefault).not.toHaveBeenCalled();
    });

    it("should return the contained value", () => {
      expect(Ok("test").$unwrapOrElse(() => {})).toBe("test");
    });
  });

  describe("$map", () => {
    it("should invoke the map function with the contained value", () => {
      const fnMap = vi.fn(() => {});

      Ok("test").$map(fnMap);

      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the map function throws", () => {
      expect(capture(() => Ok().$map(fnThrow))).toBe(errThrow);
    });

    it("should return Ok containing the mapped value", () => {
      expect(Ok().$map(() => "test")).toStrictEqual(Ok("test"));
    });
  });

  describe("$mapErr", () => {
    it("should not invoke the map error function", () => {
      const fnMapErr = vi.fn(() => {});

      Ok().$mapErr(fnMapErr);

      expect(fnMapErr).not.toHaveBeenCalled();
    });

    it("should return Ok with the contained value", () => {
      expect(Ok("test").$mapErr(() => {})).toStrictEqual(Ok("test"));
    });
  });

  describe("$mapOr", () => {
    it("should invoke the map function with the contained value", () => {
      const fnMap = vi.fn(() => {});

      Ok("test").$mapOr("default", fnMap);

      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the map function throws", () => {
      expect(capture(() => Ok().$mapOr("default", fnThrow))).toBe(errThrow);
    });

    it("should return Ok containing the mapped value", () => {
      expect(Ok().$mapOr("default", () => "mapped")).toStrictEqual(
        Ok("mapped"),
      );
    });
  });

  describe("$mapOrElse", () => {
    it("should not invoke the default function", () => {
      const fnDefault = vi.fn(() => {});

      Ok().$mapOrElse(fnDefault, () => {});

      expect(fnDefault).not.toHaveBeenCalled();
    });

    it("should invoke the map function with the contained value", () => {
      const fnMap = vi.fn(() => {});

      Ok("test").$mapOrElse(() => {}, fnMap);

      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the map function throws", () => {
      expect(capture(() => Ok().$mapOrElse(() => {}, fnThrow))).toBe(errThrow);
    });

    it("should return Ok containing the mapped value", () => {
      expect(
        Ok().$mapOrElse(
          () => "default",
          () => "mapped",
        ),
      ).toStrictEqual(Ok("mapped"));
    });
  });

  describe("$assert", () => {
    it("should invoke the map error function with the contained value when the contained value is falsey", () => {
      const fnMapErr = vi.fn(() => Ok());

      Ok("").$assert(fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith("");
    });

    it("should throw when the map error function throws", () => {
      expect(capture(() => Ok().$assert(fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the contained value when the contained value is truthy", () => {
      expect(Ok("test").$assert()).toStrictEqual(Ok("test"));
    });

    it("should return Err containing the return value of the map error function when the contained value is falsey", () => {
      expect(Ok("").$assert(() => "error")).toStrictEqual(Err("error"));
    });

    it("should return Err containing RetupleCheckFailedError contained value is falsey, and when no map error function is provided", () => {
      expect(Ok("").$assert()).toStrictEqual(Err(new RetupleAssertFailed("")));
    });
  });

  describe("$filter", () => {
    it("should invoke the check function with the contained value", () => {
      const fnCheck = vi.fn(() => true);

      Ok("").$filter(fnCheck);

      expect(fnCheck).toHaveBeenCalledExactlyOnceWith("");
    });

    it("should invoke the map error function with the contained value when the check function returns a falsey value", () => {
      const fnMapErr = vi.fn(() => "error");

      Ok("").$filter(() => false, fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith("");
    });

    it("should throw when the check function throws", () => {
      expect(capture(() => Ok().$filter(fnThrow))).toBe(errThrow);
    });

    it("should throw when the map error function throws", () => {
      expect(capture(() => Ok().$filter(() => false, fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the contained value when the check function returns a truthy value", () => {
      expect(Ok("test").$filter(() => true)).toStrictEqual(Ok("test"));
    });

    it("should return Err containing the return value of the map error function when the check function returns a falsey value", () => {
      expect(
        Ok("").$filter(
          () => false,
          () => "error",
        ),
      ).toStrictEqual(Err("error"));
    });

    it("should return Err containing RetupleCheckFailedError when the check function returns a falsey value, and when no map error function is provided", () => {
      expect(Ok("").$filter(() => false)).toStrictEqual(
        Err(new RetupleFilterFailed("")),
      );
    });
  });

  describe("$atIndex", () => {
    it("should invoke the map error function with the contained value when the array element is falsey", () => {
      const fnMapErr = vi.fn(() => "error");

      Ok(["test", ""]).$atIndex(1, fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith(["test", ""]);
    });

    it("should throw when the map error function throws", () => {
      expect(capture(() => Ok([]).$atIndex(0, fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the array element when it is truthy", () => {
      expect(Ok(["", "test"]).$atIndex(1)).toStrictEqual(Ok("test"));
    });

    it("should return Err containing the return value of the map error function when the array element is falsey", () => {
      expect(Ok(["test", ""]).$atIndex(1, () => "error")).toStrictEqual(
        Err("error"),
      );
    });

    it("should return Err containing RetupleCheckFailedError when the array element is falsey, and when no map error function is provided", () => {
      expect(Ok(["test", ""]).$atIndex(1)).toStrictEqual(
        Err(new RetupleIndexFailed(1, ["test", ""])),
      );
    });
  });

  describe("$firstIndex", () => {
    it("should invoke the map error function with the contained value when the first array element is falsey", () => {
      const fnMapErr = vi.fn(() => "error");

      Ok([""]).$firstIndex(fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith([""]);
    });

    it("should throw when the map error function throws", () => {
      expect(capture(() => Ok([]).$firstIndex(fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the first array element when it is truthy", () => {
      expect(Ok(["test", ""]).$firstIndex()).toStrictEqual(Ok("test"));
    });

    it("should return Err containing the return value of the map error function when the first array element is falsey", () => {
      expect(Ok(["", "test"]).$firstIndex(() => "error")).toStrictEqual(
        Err("error"),
      );
    });

    it("should return Err containing RetupleCheckFailedError when the first array element is falsey, and when no map error function is provided", () => {
      expect(Ok(["", "test"]).$firstIndex()).toStrictEqual(
        Err(new RetupleIndexFailed(0, ["", "test"])),
      );
    });
  });

  describe("$or", () => {
    it("should return Ok with the contained value", () => {
      expect(Ok("test").$or(Err())).toStrictEqual(Ok("test"));
    });
  });

  describe("$orElse", () => {
    it("should not invoke the or function", () => {
      const fnOr = vi.fn(() => Err());

      Ok().$orElse(fnOr);

      expect(fnOr).not.toHaveBeenCalled();
    });

    it("should return Ok with the contained value", () => {
      expect(Ok("test").$orElse(() => Err())).toStrictEqual(Ok("test"));
    });
  });

  describe("$orSafe", () => {
    it("should not invoke the safe function", () => {
      const fnSafe = vi.fn(() => {});

      Ok().$orSafe(fnSafe);

      expect(fnSafe).not.toHaveBeenCalled();
    });

    it("should not invoke the map error function", () => {
      const fnMapError = vi.fn(() => {});

      Ok().$orSafe(fnThrow, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();
    });

    it("should return Ok with the contained value", () => {
      expect(Ok("test").$orSafe(() => {})).toStrictEqual(Ok("test"));
    });
  });

  describe("$and", () => {
    it("should return the and Result", () => {
      expect(Ok().$and(Err("test"))).toStrictEqual(Err("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(Ok().$and(ResultLikeOk)).toStrictEqual(Ok("test"));
      expect(Ok().$and(ResultLikeErr)).toStrictEqual(Err("test"));
    });
  });

  describe("$and", () => {
    it("should reject when the and promise rejects", async () => {
      await expect(Ok().$async().$and(fnReject())).rejects.toBe(errReject);
    });

    it("should resolve to the and Result", async () => {
      await expect(Ok().$async().$and(Ok("test"))).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(
        Ok().$async().$and(Ok("test").$async()),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok()
          .$async()
          .$and(Promise.resolve(Ok("test"))),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(Ok().$async().$and(ResultLikeOk)).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(Ok().$async().$and(ResultLikeErr)).resolves.toStrictEqual(
        Err("test"),
      );

      await expect(
        Ok().$async().$and(Promise.resolve(ResultLikeOk)),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok().$async().$and(Promise.resolve(ResultLikeErr)),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andThen", () => {
    it("should invoke the and function with the contained value", () => {
      const fnAnd = vi.fn(() => Err());

      Ok("test").$andThen(fnAnd);

      expect(fnAnd).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the and function throws", () => {
      expect(capture(() => Ok().$andThen(fnThrow))).toBe(errThrow);
    });

    it("should return the and Result", () => {
      expect(Ok().$andThen(() => Err("test"))).toStrictEqual(Err("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(Ok().$andThen(() => ResultLikeOk)).toStrictEqual(Ok("test"));
      expect(Ok().$andThen(() => ResultLikeErr)).toStrictEqual(Err("test"));
    });
  });

  describe("$andThen", () => {
    it("should invoke the and function with the contained value", () => {
      const fnAnd = vi.fn(() => Err());

      Ok("test").$andStack(fnAnd);

      expect(fnAnd).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the and function throws", () => {
      expect(capture(() => Ok().$andStack(fnThrow))).toBe(errThrow);
    });

    it("should return the error when the and result is Err", () => {
      expect(Ok().$andStack(() => Err("test"))).toStrictEqual(Err("test"));
    });

    it("should return a tuple of the contained value and the Ok value of the and function", () => {
      expect(
        Ok("test")
          .$andStack(() => Ok("test2"))
          .$map((stack) => [...stack]),
      ).toStrictEqual(Ok(["test", "test2"]));
    });

    it("should continue stacking on an existing stack", () => {
      expect(
        Ok("test")
          .$andStack(() => Ok("test2"))
          .$andStack(() => Ok("test3"))
          .$map((stack) => [...stack]),
      ).toStrictEqual(Ok(["test", "test2", "test3"]));
    });

    it("should not stack on to a non-stacked array", () => {
      expect(
        Ok(["test"])
          .$andStack(() => Ok("test2"))
          .$andStack(() => Ok("test3"))
          .$map((stack) => [...stack]),
      ).toStrictEqual(Ok([["test"], "test2", "test3"]));
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(
        Ok("test")
          .$andStack(() => ResultLikeOk)
          .$map((stack) => [...stack]),
      ).toStrictEqual(Ok(["test", "test"]));
      expect(Ok("test").$andStack(() => ResultLikeErr)).toStrictEqual(
        Err("test"),
      );
    });
  });

  describe("$andThrough", () => {
    it("should invoke the through function with the contained value", () => {
      const fnThrough = vi.fn(() => Ok());

      Ok("test").$andThrough(fnThrough);

      expect(fnThrough).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the through function throws", () => {
      expect(capture(() => Ok().$andThrough(fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the contained value when the through function returns Ok", () => {
      expect(Ok("test").$andThrough(() => Ok("through"))).toStrictEqual(
        Ok("test"),
      );
    });

    it("should return the Err when the through function returns Err", () => {
      expect(Ok("test").$andThrough(() => Err("through"))).toStrictEqual(
        Err("through"),
      );
    });

    it("should handle custom objects with the ResultLikeSymbol", () => {
      expect(Ok().$andThrough(() => ResultLikeOk)).toStrictEqual(Ok());
      expect(Ok().$andThrough(() => ResultLikeErr)).toStrictEqual(Err("test"));
    });
  });

  describe("$andSafe", () => {
    it("should invoke the safe function with the contained value", () => {
      const fnSafe = vi.fn(() => "value");

      Ok("test").$andSafe(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should invoke the map error function with the thrown value when the safe function throws", () => {
      const fnMapError = vi.fn(() => {});

      Ok().$andSafe(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should throw when the map error function throws", () => {
      expect(
        capture(() =>
          Ok().$andSafe(() => {
            throw new Error();
          }, fnThrow),
        ),
      ).toBe(errThrow);
    });

    it("should return Ok with the safe function return value", () => {
      expect(Ok().$andSafe(() => "test")).toStrictEqual(Ok("test"));
    });

    it("should return Err with the thrown error when the safe function throws an instance of Error, and when no map error function is provided", () => {
      expect(Ok().$andSafe(fnThrow)).toStrictEqual(Err(errThrow));
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", () => {
      expect(
        Ok().$andSafe(() => {
          throw "test";
        }),
      ).toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error with the map error function when provided", () => {
      expect(Ok().$andSafe(fnThrow, () => "test")).toStrictEqual(Err("test"));
    });
  });

  describe("$andPipe", () => {
    it("should throw if any provided function throws", () => {
      const fnNoop = () => Ok();

      expect(() => Ok().$andPipe(fnNoop, fnThrow)).toThrow(errThrow);
      expect(() => Ok().$andPipe(fnNoop, fnNoop, fnThrow)).toThrow(errThrow);
      expect(() => Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnThrow)).toThrow(
        errThrow,
      );
      expect(() =>
        Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).toThrow(errThrow);
      expect(() =>
        Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).toThrow(errThrow);
      expect(() =>
        Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).toThrow(errThrow);
      expect(() =>
        Ok().$andPipe(
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

    it("should invoke the first function with the contained value", () => {
      const fnPipe = vi.fn(() => Ok());

      Ok("test").$andPipe(fnPipe, () => Ok());

      expect(fnPipe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should invoke each function in sequence and pass the previous ok value to the next function", () => {
      const fnPipe = vi.fn((val: number) => Ok(val + 1));

      Ok(1).$andPipe(
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
      );

      expect(fnPipe).toHaveBeenNthCalledWith(1, 1);
      expect(fnPipe).toHaveBeenNthCalledWith(2, 2);
      expect(fnPipe).toHaveBeenNthCalledWith(3, 3);
      expect(fnPipe).toHaveBeenNthCalledWith(4, 4);
      expect(fnPipe).toHaveBeenNthCalledWith(5, 5);
      expect(fnPipe).toHaveBeenNthCalledWith(6, 6);
      expect(fnPipe).toHaveBeenNthCalledWith(7, 7);
      expect(fnPipe).toHaveBeenNthCalledWith(8, 8);

      expect(fnPipe).toHaveNthReturnedWith(1, Ok(2));
      expect(fnPipe).toHaveNthReturnedWith(2, Ok(3));
      expect(fnPipe).toHaveNthReturnedWith(3, Ok(4));
      expect(fnPipe).toHaveNthReturnedWith(4, Ok(5));
      expect(fnPipe).toHaveNthReturnedWith(5, Ok(6));
      expect(fnPipe).toHaveNthReturnedWith(6, Ok(7));
      expect(fnPipe).toHaveNthReturnedWith(7, Ok(8));
      expect(fnPipe).toHaveNthReturnedWith(8, Ok(9));
    });

    it("should return the first returned Err encountered", () => {
      const fnNoop = () => Ok();
      const fnErr = () => Err("test");

      expect(Ok().$andPipe(fnErr, fnNoop)).toStrictEqual(Err("test"));
      expect(Ok().$andPipe(fnNoop, fnErr)).toStrictEqual(Err("test"));
      expect(Ok().$andPipe(fnNoop, fnNoop, fnErr)).toStrictEqual(Err("test"));
      expect(Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnErr)).toStrictEqual(
        Err("test"),
      );
      expect(
        Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).toStrictEqual(Err("test"));
      expect(
        Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).toStrictEqual(Err("test"));
      expect(
        Ok().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).toStrictEqual(Err("test"));
      expect(
        Ok().$andPipe(
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
        Ok().$andPipe(
          () => Ok(),
          () => ResultLikeOk,
        ),
      ).toStrictEqual(Ok("test"));

      expect(
        Ok().$andPipe(
          () => Ok(),
          () => ResultLikeErr,
        ),
      ).toStrictEqual(Err("test"));
    });
  });

  describe("$andPipeAsync", () => {
    it("should reject if any provided function throws", async () => {
      const fnNoop = () => Ok();

      await expect(Ok().$andPipeAsync(fnNoop, fnThrow)).rejects.toBe(errThrow);
      await expect(Ok().$andPipeAsync(fnNoop, fnNoop, fnThrow)).rejects.toBe(
        errThrow,
      );
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok().$andPipeAsync(
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
        Ok().$andPipeAsync(
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

      await expect(Ok().$andPipeAsync(fnNoop, fnReject)).rejects.toBe(
        errReject,
      );
      await expect(Ok().$andPipeAsync(fnNoop, fnNoop, fnReject)).rejects.toBe(
        errReject,
      );
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok().$andPipeAsync(
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
        Ok().$andPipeAsync(
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

    it("should invoke the first function with the contained value", async () => {
      const fnPipe = vi.fn(() => Ok());

      await Ok("test").$andPipeAsync(fnPipe, () => Ok());

      expect(fnPipe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should resolve each function in sequence and pass the previous ok value to the next function", async () => {
      const fnPipe = vi.fn((val: number) => Ok(val + 1).$async());

      await Ok(1).$andPipeAsync(
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
        fnPipe,
      );

      expect(fnPipe).toHaveBeenNthCalledWith(1, 1);
      expect(fnPipe).toHaveBeenNthCalledWith(2, 2);
      expect(fnPipe).toHaveBeenNthCalledWith(3, 3);
      expect(fnPipe).toHaveBeenNthCalledWith(4, 4);
      expect(fnPipe).toHaveBeenNthCalledWith(5, 5);
      expect(fnPipe).toHaveBeenNthCalledWith(6, 6);
      expect(fnPipe).toHaveBeenNthCalledWith(7, 7);
      expect(fnPipe).toHaveBeenNthCalledWith(8, 8);

      expect(fnPipe).toHaveNthReturnedWith(1, Ok(2).$async());
      expect(fnPipe).toHaveNthReturnedWith(2, Ok(3).$async());
      expect(fnPipe).toHaveNthReturnedWith(3, Ok(4).$async());
      expect(fnPipe).toHaveNthReturnedWith(4, Ok(5).$async());
      expect(fnPipe).toHaveNthReturnedWith(5, Ok(6).$async());
      expect(fnPipe).toHaveNthReturnedWith(6, Ok(7).$async());
      expect(fnPipe).toHaveNthReturnedWith(7, Ok(8).$async());
      expect(fnPipe).toHaveNthReturnedWith(8, Ok(9).$async());
    });

    it("should resolve with the first returned Err encountered", async () => {
      const fnNoop = () => Ok().$async();
      const fnErr = () => Err("test").$async();

      await expect(Ok().$andPipeAsync(fnErr, fnNoop)).resolves.toStrictEqual(
        Err("test"),
      );
      await expect(Ok().$andPipeAsync(fnNoop, fnErr)).resolves.toStrictEqual(
        Err("test"),
      );
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$andPipeAsync(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$andPipeAsync(
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
        Ok().$andPipeAsync(
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
        Ok().$andPipeAsync(
          () => Ok().$async(),
          () => ResultLikeOk,
        ),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok().$andPipeAsync(
          () => Ok().$async(),
          () => ResultLikeErr,
        ),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok().$andPipeAsync(
          async () => Ok(),
          async () => ResultLikeOk,
        ),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok().$andPipeAsync(
          async () => Ok(),
          async () => ResultLikeErr,
        ),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$peek", () => {
    it("should invoke the peek function with the current Result", () => {
      let calledWithValue: any;
      const fnPeek = vi.fn((value) => (calledWithValue = value));

      Ok("test").$peek(fnPeek);

      expect(fnPeek).toHaveBeenCalledTimes(1);
      expect(calledWithValue).toStrictEqual(Ok("test"));
    });

    it("should throw when the peek function throws", () => {
      expect(capture(() => Ok().$peek(fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the contained value", () => {
      expect(Ok("test").$peek(() => {})).toStrictEqual(Ok("test"));
    });
  });

  describe("$tap", () => {
    it("should invoke the tap function with the contained value", () => {
      const fnTap = vi.fn(() => {});

      Ok("test").$tap(fnTap);

      expect(fnTap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the tap function throws", () => {
      expect(capture(() => Ok().$tap(fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the contained value", () => {
      expect(Ok("test").$tap(() => {})).toStrictEqual(Ok("test"));
    });
  });

  describe("$tapErr", () => {
    it("should not invoke the tap error function", () => {
      const fnTapErr = vi.fn(() => {});

      Ok().$tapErr(fnTapErr);

      expect(fnTapErr).not.toHaveBeenCalled();
    });

    it("should return Ok with the contained value", () => {
      expect(Ok("test").$tapErr(() => {})).toStrictEqual(Ok("test"));
    });
  });

  describe("$flatten", () => {
    it("should return the contained Result", () => {
      expect(Ok(Ok("test")).$flatten()).toStrictEqual(Ok("test"));
      expect(Ok(Err("test")).$flatten()).toStrictEqual(Err("test"));
    });
  });

  describe("$async", () => {
    it("should return ResultAsync", async () => {
      const prototype = Object.getPrototypeOf(Result.$safeAsync(() => {}));

      expect(Ok().$async()).toBeInstanceOf(prototype.constructor);
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(Ok("test").$async()).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$promise", () => {
    it("should return a Promise", () => {
      expect(Ok().$promise()).toBeInstanceOf(Promise);
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(Ok("test").$promise()).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$iter", () => {
    it("should return an iterator", () => {
      const iterator = Ok([]).$iter();

      expect(iterator).toHaveProperty("next");
      expect(iterator.next).toBeTypeOf("function");
      expect(iterator[Symbol.iterator]).toBeDefined();
    });

    it("should be an iterator over the contained value", () => {
      const iterator = Ok([1, 2, 3]).$iter();

      expect(iterator.next()).toStrictEqual({ value: 1, done: false });
      expect(iterator.next()).toStrictEqual({ value: 2, done: false });
      expect(iterator.next()).toStrictEqual({ value: 3, done: false });
      expect(iterator.next()).toStrictEqual({
        value: undefined,
        done: true,
      });
    });
  });

  describe("$orAsync", () => {
    it("should not reject when the or promise rejects", async () => {
      const rejected = fnReject();

      await expect(Ok("test").$orAsync(rejected)).resolves.toStrictEqual(
        Ok("test"),
      );

      await rejected.catch(() => {});
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(Ok("test").$orAsync(Ok())).resolves.toStrictEqual(
        Ok("test"),
      );
    });
  });

  describe("$orElseAsync", () => {
    it("should not invoke the or function", async () => {
      const fnOr = vi.fn(() => Err());

      await Ok().$orElseAsync(fnOr);

      expect(fnOr).not.toHaveBeenCalled();
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(Ok("test").$orElseAsync(() => Ok())).resolves.toStrictEqual(
        Ok("test"),
      );
    });
  });

  describe("$orSafeAsync", () => {
    it("should not invoke the safe function", async () => {
      const fnSafe = vi.fn(() => {});

      await Ok().$orSafeAsync(fnSafe);

      expect(fnSafe).not.toHaveBeenCalled();
    });

    it("should not invoke the map error function", async () => {
      const fnMapError = vi.fn(() => {});

      await Ok().$orSafeAsync(fnThrow, fnMapError);
      await Ok().$orSafeAsync(fnReject, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(Ok("test").$orSafeAsync(() => {})).resolves.toStrictEqual(
        Ok("test"),
      );
    });
  });

  describe("$orSafePromise", () => {
    it("should not invoke the map error function", async () => {
      const fnMapError = vi.fn(() => {});
      const rejected = fnReject();

      await Ok().$orSafePromise(rejected, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();

      await rejected.catch(() => {});
    });

    it("should not reject when the promise rejects", async () => {
      const rejected = fnReject();

      await expect(Ok("test").$orSafePromise(rejected)).resolves.toStrictEqual(
        Ok("test"),
      );

      await rejected.catch(() => {});
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test").$orSafePromise(Promise.resolve()),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$andAsync", () => {
    it("should reject when the and promise rejects", async () => {
      await expect(Ok().$andAsync(fnReject())).rejects.toBe(errReject);
    });

    it("should resolve to the and Result", async () => {
      await expect(Ok().$andAsync(Ok("test"))).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(Ok().$andAsync(Ok("test").$async())).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(
        Ok().$andAsync(Promise.resolve(Ok("test"))),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(Ok().$andAsync(ResultLikeOk)).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(Ok().$andAsync(ResultLikeErr)).resolves.toStrictEqual(
        Err("test"),
      );

      await expect(
        Ok().$andAsync(Promise.resolve(ResultLikeOk)),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok().$andAsync(Promise.resolve(ResultLikeErr)),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andThenAsync", () => {
    it("should invoke the and function with the contained value", async () => {
      const fnAnd = vi.fn(() => Err());

      await Ok("test").$andThenAsync(fnAnd);

      expect(fnAnd).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the and function throws", async () => {
      await expect(Ok().$andThenAsync(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the and function rejects", async () => {
      await expect(Ok().$andThenAsync(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to the and Result", async () => {
      await expect(Ok().$andThenAsync(() => Ok("test"))).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(
        Ok().$andThenAsync(async () => Ok("test")),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(
        Ok().$andThenAsync(() => ResultLikeOk),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok().$andThenAsync(() => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok().$andThenAsync(async () => ResultLikeOk),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok().$andThenAsync(async () => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andThroughAsync", () => {
    it("should invoke the through function with the contained value", async () => {
      const fnThrough = vi.fn(() => Ok());

      await Ok("test").$andThroughAsync(fnThrough);

      expect(fnThrough).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the through function throws", async () => {
      await expect(Ok().$andThroughAsync(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the through function rejects", async () => {
      await expect(Ok().$andThroughAsync(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to Ok with the contained value when the through function resolves to Ok", async () => {
      await expect(
        Ok("test").$andThroughAsync(() => Ok()),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok("test").$andThroughAsync(async () => Ok()),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to the Err when the though function resolves to Err", async () => {
      await expect(
        Ok().$andThroughAsync(() => Err("test")),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok().$andThroughAsync(() => Err("test")),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(
        Ok().$andThroughAsync(() => ResultLikeOk),
      ).resolves.toStrictEqual(Ok());

      await expect(
        Ok().$andThroughAsync(() => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok().$andThroughAsync(async () => ResultLikeOk),
      ).resolves.toStrictEqual(Ok());

      await expect(
        Ok().$andThroughAsync(async () => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andSafeAsync", () => {
    it("should invoke the safe function with the contained value", async () => {
      const fnSafe = vi.fn(() => "value");

      await Ok("test").$andSafeAsync(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should invoke the map error function with the thrown value when the safe function throws", async () => {
      const fnMapError = vi.fn(() => {});

      await Ok().$andSafeAsync(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should invoke the map error function with the rejected value when the safe function rejects", async () => {
      const fnMapError = vi.fn(() => {});

      await Ok().$andSafeAsync(fnReject, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Ok().$andSafeAsync(fnReject, fnThrow)).rejects.toBe(
        errThrow,
      );
    });

    it("should resolve to Ok with the safe value", async () => {
      await expect(Ok().$andSafeAsync(() => "test")).resolves.toStrictEqual(
        Ok("test"),
      );

      await expect(
        Ok().$andSafeAsync(async () => "test"),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err with the thrown/rejected error when the safe function throws or rejects", async () => {
      await expect(Ok("test").$andSafeAsync(fnThrow)).resolves.toStrictEqual(
        Err(errThrow),
      );

      await expect(Ok("test").$andSafeAsync(fnReject)).resolves.toStrictEqual(
        Err(errReject),
      );
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Ok().$andSafeAsync(() => {
          throw "test";
        }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));

      await expect(
        Ok().$andSafeAsync(async () => {
          throw "test";
        }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error with the map error function when provided", async () => {
      await expect(
        Ok().$andSafeAsync(fnThrow, () => "test"),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok().$andSafeAsync(fnReject, () => "test"),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andSafePromise", () => {
    it("should invoke the map error function with the rejected value when the promise rejects", async () => {
      const fnMapError = vi.fn(() => {});
      const rejected = fnReject();

      await Ok().$andSafePromise(rejected, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);

      await rejected.catch(() => {});
    });

    it("should reject when the map error function throws", async () => {
      await expect(Ok().$andSafePromise(fnReject(), fnThrow)).rejects.toBe(
        errThrow,
      );
    });

    it("should resolve to Ok with the safe value", async () => {
      await expect(
        Ok().$andSafePromise(Promise.resolve("test")),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err with the rejected error when the promise rejects", async () => {
      await expect(
        Ok("test").$andSafePromise(fnReject()),
      ).resolves.toStrictEqual(Err(errReject));
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Ok().$andSafePromise(Promise.reject("test")),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error with the map error function when provided", async () => {
      await expect(
        Ok().$andSafePromise(fnReject(), () => "test"),
      ).resolves.toStrictEqual(Err("test"));
    });
  });
});
