import { vi, describe, it, expect } from "vitest";

import {
  ResultLikeOk,
  ResultLikeErr,
  errThrow,
  errReject,
  fnThrow,
  fnReject,
} from "./util.js";

import {
  Ok,
  Err,
  RetupleUnwrapErrFailed,
  RetupleCaughtValueError,
  RetupleCheckFailedError,
} from "../src/index.js";

describe("ResultAsync (Ok)", async () => {
  describe("$expect", () => {
    it("should resolve to the contained value", async () => {
      await expect(Ok("test").$async().$expect()).resolves.toBe("test");
    });
  });

  describe("$unwrap", () => {
    it("should resolve to the contained value", async () => {
      await expect(Ok("test").$async().$unwrap()).resolves.toBe("test");
    });
  });

  describe("$unwrapErr", () => {
    it("should reject with RetupleUnwrapErrFailed", async () => {
      await expect(Ok().$async().$unwrapErr()).rejects.toThrow(
        RetupleUnwrapErrFailed,
      );
    });

    it("should include the contained value on rejected RetupleUnwrapErrFailed", async () => {
      await expect(Ok("test").$async().$unwrapErr()).rejects.toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });

    it("should use the custom error message for the rejected RetupleUnwrapErrFailed when provided", async () => {
      await expect(() =>
        Ok().$async().$unwrapErr("Test error message"),
      ).rejects.toThrow("Test error message");
    });
  });

  describe("$unwrapOr", () => {
    it("should resolve to the contained value", async () => {
      await expect(Ok("test").$async().$unwrapOr("default")).resolves.toBe(
        "test",
      );
    });
  });

  describe("$unwrapOrElse", () => {
    it("should not invoke the default function", async () => {
      const fnDefault = vi.fn(() => {});

      await Ok().$async().$unwrapOrElse(fnDefault);

      expect(fnDefault).not.toHaveBeenCalled();
    });

    it("should resolve to the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$unwrapOrElse(() => "default"),
      ).resolves.toBe("test");
    });
  });

  describe("$map", () => {
    it("should invoke the map function with the contained value", async () => {
      const fnMap = vi.fn(() => {});

      await Ok("test").$async().$map(fnMap);

      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the map function throws", async () => {
      await expect(Ok().$async().$map(fnThrow)).rejects.toBe(errThrow);
    });

    it("should resolve to Ok containing the mapped value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$map(() => "mapped"),
      ).resolves.toStrictEqual(Ok("mapped"));
    });
  });

  describe("$mapErr", () => {
    it("should not invoke the map error function", async () => {
      const fnMapErr = vi.fn(() => {});

      await Ok().$async().$mapErr(fnMapErr);

      expect(fnMapErr).not.toHaveBeenCalled();
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$mapErr(() => {}),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$mapOr", () => {
    it("should invoke the map function with the contained value", async () => {
      const fnMap = vi.fn(() => {});

      await Ok("test").$async().$mapOr("default", fnMap);

      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the map function throws", async () => {
      await expect(Ok().$async().$map(fnThrow)).rejects.toBe(errThrow);
    });

    it("should resolve to Ok containing the mapped value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$mapOr("default", () => "mapped"),
      ).resolves.toStrictEqual(Ok("mapped"));
    });
  });

  describe("$mapOrElse", () => {
    it("should not invoke the default function", async () => {
      const fnDefault = vi.fn(() => {});

      await Ok()
        .$async()
        .$mapOrElse(fnDefault, () => {});

      expect(fnDefault).not.toHaveBeenCalled();
    });

    it("should invoke the map function with the contained value", async () => {
      const fnMap = vi.fn(() => {});

      await Ok("test")
        .$async()
        .$mapOrElse(() => {}, fnMap);

      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the map function throws", async () => {
      await expect(
        Ok()
          .$async()
          .$mapOrElse(() => {}, fnThrow),
      ).rejects.toBe(errThrow);
    });

    it("should resolve to Ok containing the mapped value", async () => {
      await expect(
        Ok()
          .$async()
          .$mapOrElse(
            () => "default",
            () => "mapped",
          ),
      ).resolves.toStrictEqual(Ok("mapped"));
    });
  });

  describe("$assert", () => {
    it("should invoke the map error function with the contained value when the contained value is falsey, and when no predicate/condition function is provided", async () => {
      const fnMapErr = vi.fn(() => "error");

      await Ok("").$async().$assert(fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith("");
    });

    it("should reject when the map error function throws", async () => {
      await expect(Ok().$async().$assert(fnThrow)).rejects.toBe(errThrow);
    });

    it("should resolve to Ok with the contained value when the contained value is truthy", async () => {
      await expect(Ok("test").$async().$assert()).resolves.toStrictEqual(
        Ok("test"),
      );
    });

    it("should resolve to Err containing the return value of the map error function when the contained value is falsey", async () => {
      await expect(
        Ok(false)
          .$async()
          .$assert(() => "error"),
      ).resolves.toStrictEqual(Err("error"));
    });

    it("should resolve to Err containing RetupleCheckFailedError contained value is falsey, and when no map error function is provided", async () => {
      await expect(Ok("").$async().$assert()).resolves.toStrictEqual(
        Err(new RetupleCheckFailedError("")),
      );
    });
  });

  describe("$check", () => {
    it("should invoke the check function with the contained value", async () => {
      const fnCheck = vi.fn(() => true);

      await Ok("").$async().$check(fnCheck);

      expect(fnCheck).toHaveBeenCalledExactlyOnceWith("");
    });

    it("should invoke the map error function with the contained value when the check function returns a falsey value", async () => {
      const fnMapErr = vi.fn(() => "error");

      await Ok("")
        .$async()
        .$check(() => false, fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith("");
    });

    it("should reject when the check function throws", async () => {
      await expect(Ok().$async().$check(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the map error function throws", async () => {
      await expect(
        Ok()
          .$async()
          .$check(() => false, fnThrow),
      ).rejects.toBe(errThrow);
    });

    it("should resolve to Ok with the contained value when the check function returns a truthy value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$check(() => true),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err containing the return value of the map error function when the check function returns a falsey value", async () => {
      await expect(
        Ok(false)
          .$async()
          .$check(
            () => false,
            () => "error",
          ),
      ).resolves.toStrictEqual(Err("error"));
    });

    it("should resolve to Err containing RetupleCheckFailedError when the check function returns a falsey value, and when no map error function is provided", async () => {
      await expect(
        Ok("")
          .$async()
          .$check(() => false),
      ).resolves.toStrictEqual(Err(new RetupleCheckFailedError("")));
    });
  });

  describe("$atIndex", () => {
    it("should invoke the map error function with the contained value when the resolved array element is falsey", async () => {
      const fnMapErr = vi.fn(() => "error");

      await Ok(["test", ""]).$async().$atIndex(1, fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith(["test", ""]);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Ok([]).$async().$atIndex(0, fnThrow)).rejects.toBe(errThrow);
    });

    it("should resolve to Ok with the resolved array element when it is truthy", async () => {
      await expect(
        Ok(["", "test"]).$async().$atIndex(1),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err containing the return value of the map error function when the array element is falsey", async () => {
      await expect(
        Ok(["test", ""])
          .$async()
          .$atIndex(1, () => "error"),
      ).resolves.toStrictEqual(Err("error"));
    });

    it("should resolve to Err containing RetupleCheckFailedError when the array element is falsey, and when no map error function is provided", async () => {
      await expect(
        Ok(["", "test"]).$async().$atIndex(0),
      ).resolves.toStrictEqual(Err(new RetupleCheckFailedError(["", "test"])));
    });
  });

  describe("$firstIndex", () => {
    it("should invoke the map error function with the contained value when the first resolved array element is falsey", async () => {
      const fnMapErr = vi.fn(() => "error");

      await Ok([""]).$async().$firstIndex(fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith([""]);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Ok([]).$async().$firstIndex(fnThrow)).rejects.toBe(errThrow);
    });

    it("should resolve to Ok with the first resolved array element when it is truthy", async () => {
      await expect(
        Ok(["test", ""]).$async().$firstIndex(),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err containing the return value of the map error function when the first array element is falsey", async () => {
      await expect(
        Ok(["", "test"])
          .$async()
          .$firstIndex(() => "error"),
      ).resolves.toStrictEqual(Err("error"));
    });

    it("should resolve to Err containing RetupleCheckFailedError when the first array element is falsey, and when no map error function is provided", async () => {
      await expect(
        Ok(["", "test"]).$async().$firstIndex(),
      ).resolves.toStrictEqual(Err(new RetupleCheckFailedError(["", "test"])));
    });
  });

  describe("$or", () => {
    it("should not reject when the or promise rejects", async () => {
      const rejected = fnReject();

      await expect(Ok("test").$async().$or(rejected)).resolves.toStrictEqual(
        Ok("test"),
      );

      await rejected.catch(() => {});
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(Ok("test").$async().$or(Ok())).resolves.toStrictEqual(
        Ok("test"),
      );
    });
  });

  describe("$orElse", () => {
    it("should not invoke the or function", async () => {
      const fnOr = vi.fn(() => Err());

      await Ok().$async().$orElse(fnOr);

      expect(fnOr).not.toHaveBeenCalled();
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$orElse(() => Ok()),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$orSafe", () => {
    it("should not invoke the safe function", async () => {
      const fnSafe = vi.fn(() => {});

      await Ok().$async().$orSafe(fnSafe);

      expect(fnSafe).not.toHaveBeenCalled();
    });

    it("should not invoke the map error function", async () => {
      const fnMapError = vi.fn(() => {});

      await Ok().$async().$orSafe(fnThrow, fnMapError);
      await Ok().$async().$orSafe(fnReject, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$orSafe(() => {}),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$orSafePromise", () => {
    it("should not invoke the map error function", async () => {
      const fnMapError = vi.fn(() => {});
      const rejected = fnReject();

      await Ok().$async().$orSafePromise(rejected, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();

      await rejected.catch(() => {});
    });

    it("should not reject when the promise rejects", async () => {
      const rejected = fnReject();

      await expect(
        Ok("test").$async().$orSafePromise(rejected),
      ).resolves.toStrictEqual(Ok("test"));

      await rejected.catch(() => {});
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test").$async().$orSafePromise(Promise.resolve()),
      ).resolves.toStrictEqual(Ok("test"));
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
    it("should invoke the and function with the contained value", async () => {
      const fnAnd = vi.fn(() => Err());

      await Ok("test").$async().$andThen(fnAnd);

      expect(fnAnd).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the and function throws", async () => {
      await expect(Ok().$async().$andThen(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the and function rejects", async () => {
      await expect(Ok().$async().$andThen(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to the and Result", async () => {
      await expect(
        Ok()
          .$async()
          .$andThen(() => Ok("test")),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok()
          .$async()
          .$andThen(async () => Ok("test")),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(
        Ok()
          .$async()
          .$andThen(() => ResultLikeOk),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok()
          .$async()
          .$andThen(() => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok()
          .$async()
          .$andThen(async () => ResultLikeOk),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok()
          .$async()
          .$andThen(async () => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andThrough", () => {
    it("should invoke the through function with the contained value", async () => {
      const fnThrough = vi.fn(() => Ok());

      await Ok("test").$async().$andThrough(fnThrough);

      expect(fnThrough).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the through function throws", async () => {
      await expect(Ok().$async().$andThrough(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the through function rejects", async () => {
      await expect(Ok().$async().$andThrough(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to Ok with the contained value when the through function resolves to Ok", async () => {
      await expect(
        Ok("test")
          .$async()
          .$andThrough(() => Ok()),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok("test")
          .$async()
          .$andThrough(async () => Ok()),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to the Err when the though function resolves to Err", async () => {
      await expect(
        Ok()
          .$async()
          .$andThrough(() => Err("test")),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok()
          .$async()
          .$andThrough(() => Err("test")),
      ).resolves.toStrictEqual(Err("test"));
    });

    it("should handle custom objects with the ResultLikeSymbol", async () => {
      await expect(
        Ok()
          .$async()
          .$andThrough(() => ResultLikeOk),
      ).resolves.toStrictEqual(Ok());

      await expect(
        Ok()
          .$async()
          .$andThrough(() => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok()
          .$async()
          .$andThrough(async () => ResultLikeOk),
      ).resolves.toStrictEqual(Ok());

      await expect(
        Ok()
          .$async()
          .$andThrough(async () => ResultLikeErr),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andSafe", () => {
    it("should invoke the safe function with the contained value", async () => {
      const fnSafe = vi.fn(() => "value");

      await Ok("test").$async().$andSafe(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should invoke the map error function with the thrown value when the safe function throws", async () => {
      const fnMapError = vi.fn(() => {});

      await Ok().$async().$andSafe(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should invoke the map error function with the rejected value when the safe function rejects", async () => {
      const fnMapError = vi.fn(() => {});

      await Ok().$async().$andSafe(fnReject, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Ok().$async().$andSafe(fnReject, fnThrow)).rejects.toBe(
        errThrow,
      );
    });

    it("should resolve to Ok with the safe value", async () => {
      await expect(
        Ok()
          .$async()
          .$andSafe(() => "test"),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok()
          .$async()
          .$andSafe(async () => "test"),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err with the thrown/rejected error when the safe function throws or rejects", async () => {
      await expect(
        Ok("test").$async().$andSafe(fnThrow),
      ).resolves.toStrictEqual(Err(errThrow));

      await expect(
        Ok("test").$async().$andSafe(fnReject),
      ).resolves.toStrictEqual(Err(errReject));
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Ok()
          .$async()
          .$andSafe(() => {
            throw "test";
          }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));

      await expect(
        Ok()
          .$async()
          .$andSafe(async () => {
            throw "test";
          }),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error with the map error function when provided", async () => {
      await expect(
        Ok()
          .$async()
          .$andSafe(fnThrow, () => "test"),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok()
          .$async()
          .$andSafe(fnReject, () => "test"),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andSafePromise", () => {
    it("should invoke the map error function with the rejected value when the promise rejects", async () => {
      const fnMapError = vi.fn(() => {});
      const rejected = fnReject();

      await Ok().$async().$andSafePromise(rejected, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);

      await rejected.catch(() => {});
    });

    it("should reject when the map error function throws", async () => {
      await expect(
        Ok().$async().$andSafePromise(fnReject(), fnThrow),
      ).rejects.toBe(errThrow);
    });

    it("should resolve to Ok with the safe value", async () => {
      await expect(
        Ok().$async().$andSafePromise(Promise.resolve("test")),
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err with the rejected error when the promise rejects", async () => {
      await expect(
        Ok("test").$async().$andSafePromise(fnReject()),
      ).resolves.toStrictEqual(Err(errReject));
    });

    it("should map the error to RetupleCaughtValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Ok().$async().$andSafePromise(Promise.reject("test")),
      ).resolves.toStrictEqual(Err(new RetupleCaughtValueError("test")));
    });

    it("should map the error with the map error function when provided", async () => {
      await expect(
        Ok()
          .$async()
          .$andSafePromise(fnReject(), () => "test"),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$andPipe", () => {
    it("should reject if any provided function throws", async () => {
      const fnNoop = () => Ok();

      await expect(Ok().$async().$andPipe(fnNoop, fnThrow)).rejects.toBe(
        errThrow,
      );
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok()
          .$async()
          .$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnThrow),
      ).rejects.toBe(errThrow);
      await expect(
        Ok()
          .$async()
          .$andPipe(
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

      await expect(Ok().$async().$andPipe(fnNoop, fnReject)).rejects.toBe(
        errReject,
      );
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok()
          .$async()
          .$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok()
          .$async()
          .$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnReject),
      ).rejects.toBe(errReject);
      await expect(
        Ok()
          .$async()
          .$andPipe(
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

      await Ok("test")
        .$async()
        .$andPipe(fnPipe, () => Ok());

      expect(fnPipe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should resolve each function in sequence and pass the previous ok value to the next function", async () => {
      const fnPipe = vi.fn((val: number) => Ok(val + 1).$async());

      await Ok(1)
        .$async()
        .$andPipe(
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

      await expect(
        Ok().$async().$andPipe(fnErr, fnNoop),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$async().$andPipe(fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok().$async().$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok()
          .$async()
          .$andPipe(fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnNoop, fnErr),
      ).resolves.toStrictEqual(Err("test"));
      await expect(
        Ok()
          .$async()
          .$andPipe(
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
        Ok()
          .$async()
          .$andPipe(
            () => Ok().$async(),
            () => ResultLikeOk,
          ),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok()
          .$async()
          .$andPipe(
            () => Ok().$async(),
            () => ResultLikeErr,
          ),
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Ok()
          .$async()
          .$andPipe(
            async () => Ok(),
            async () => ResultLikeOk,
          ),
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Ok()
          .$async()
          .$andPipe(
            async () => Ok(),
            async () => ResultLikeErr,
          ),
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$peek", () => {
    it("should invoke the peek function with the current Result", async () => {
      let calledWithValue: any;
      const fnPeek = vi.fn((value) => (calledWithValue = value));

      await Ok("test").$async().$peek(fnPeek);

      expect(fnPeek).toHaveBeenCalledTimes(1);
      expect(calledWithValue).toStrictEqual(Ok("test"));
    });

    it("should reject when the peek function throws", async () => {
      await expect(Ok().$async().$peek(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the peek function rejects", async () => {
      await expect(Ok().$async().$peek(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$peek(() => {}),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$tap", () => {
    it("should invoke the tap function with the contained value", async () => {
      const fnTap = vi.fn(() => {});

      await Ok("test").$async().$tap(fnTap);

      expect(fnTap).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the tap function throws", async () => {
      await expect(Ok().$async().$tap(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the tap function rejects", async () => {
      await expect(Ok().$async().$tap(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$tap(() => {}),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$tapErr", () => {
    it("should not invoke the tap error function", async () => {
      const fnTapErr = vi.fn(() => {});

      await Ok().$async().$tapErr(fnTapErr);

      expect(fnTapErr).not.toHaveBeenCalled();
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$tapErr(() => {}),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$flatten", () => {
    it("should return the contained Result", async () => {
      await expect(Ok(Ok("test")).$async().$flatten()).resolves.toStrictEqual(
        Ok("test"),
      );
      await expect(Ok(Err("test")).$async().$flatten()).resolves.toStrictEqual(
        Err("test"),
      );
    });
  });

  describe("$promise", () => {
    it("should return a Promise", () => {
      expect(Ok().$async().$promise()).toBeInstanceOf(Promise);
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(Ok("test").$async().$promise()).resolves.toStrictEqual(
        Ok("test"),
      );
    });
  });

  describe("$iter", () => {
    it("should return an iterator", async () => {
      const iterator = await Ok([]).$async().$iter();

      expect(iterator).toHaveProperty("next");
      expect(iterator.next).toBeTypeOf("function");
      expect(iterator[Symbol.iterator]).toBeDefined();
    });

    it("should be an iterator over the contained value", async () => {
      const iterator = await Ok([1, 2, 3]).$async().$iter();

      expect(iterator.next()).toStrictEqual({ value: 1, done: false });
      expect(iterator.next()).toStrictEqual({ value: 2, done: false });
      expect(iterator.next()).toStrictEqual({ value: 3, done: false });
      expect(iterator.next()).toStrictEqual({
        value: undefined,
        done: true,
      });
    });
  });
});
