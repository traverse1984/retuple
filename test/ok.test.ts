import { vi, describe, test, expect } from "vitest";
import { ResultOk, ResultAsync } from "./internals.js";
import { capture, errThrow, fnThrow } from "./util.js";

import {
  Ok,
  Err,
  RetupleUnwrapErrFailed,
  RetupleThrownValueError,
} from "../src/index.js";

describe("Ok", () => {
  test("Returns an instance of ResultOk", () => {
    expect(Ok()).toBeInstanceOf(ResultOk);
  });

  test("Is an array of length 2", () => {
    const ok = Ok();

    expect(ok).toBeInstanceOf(Array);
    expect(ok.length).toBe(2);
  });

  test("The first element is undefined", () => {
    expect(Ok("test")[0]).toBe(undefined);
  });

  test("The second element is the value", () => {
    expect(Ok("test")[1]).toBe("test");
  });

  test("When called with no arguments, the value is undefined", () => {
    expect(Ok()[1]).toBe(undefined);
  });

  describe("$value", () => {
    test("Returns the contained value", () => {
      expect(Ok("test").$value()).toBe("test");
    });
  });

  describe("$isOk", () => {
    test("Returns true", () => {
      expect(Ok().$isOk()).toBe(true);
    });
  });

  describe("$isOkAnd", () => {
    test("Returns the outcome of the predicate function", () => {
      const fn = vi.fn((value) => value === "test");

      expect(Ok("test").$isOkAnd(fn)).toBe(true);
      expect(fn).toHaveBeenLastCalledWith("test");

      expect(Ok("value").$isOkAnd(fn)).toBe(false);
      expect(fn).toHaveBeenLastCalledWith("value");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("Throws the error when the predicate function throws", () => {
      expect(capture(() => Ok().$isOkAnd(fnThrow))).toBe(errThrow);
    });
  });

  describe("$isErr", () => {
    test("Returns false", () => {
      expect(Ok("test").$isErr()).toBe(false);
    });
  });

  describe("$isErrAnd", () => {
    test("Returns false", () => {
      const fn = vi.fn(() => true);

      expect(Ok("test").$isErrAnd(fn)).toBe(false);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$expect", () => {
    test("Returns the contained value", () => {
      expect(Ok("test").$expect()).toBe("test");
    });
  });

  describe("$unwrap", () => {
    test("Returns the contained value", () => {
      expect(Ok("test").$unwrap()).toBe("test");
    });
  });

  describe("$unwrapErr", () => {
    test("Throws RetupleUnwrapErrFailed", () => {
      expect(() => Ok().$unwrapErr()).toThrow(RetupleUnwrapErrFailed);
      expect(() => Ok("test").$unwrapErr()).toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Uses the custom message if provided", () => {
      expect(() => Ok().$unwrapErr("Test error message")).toThrow(
        "Test error message",
      );
    });
  });

  describe("$unwrapOr", () => {
    test("Returns the contained value", () => {
      expect(Ok("test").$unwrapOr("default")).toBe("test");
    });
  });

  describe("$unwrapOrElse", () => {
    test("Returns the contained value", () => {
      const fn = vi.fn(() => "default");

      expect(Ok("test").$unwrapOrElse(fn)).toBe("test");
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$map", () => {
    test("Returns Ok containing the mapped value", () => {
      const fn = vi.fn(() => "mapped");

      expect(Ok("test").$map(fn).$unwrap()).toBe("mapped");
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Ok().$map(fnThrow))).toBe(errThrow);
    });
  });

  describe("$mapErr", () => {
    test("Returns itself", () => {
      const ok = Ok();
      const fn = vi.fn(() => "mapped");

      expect(ok.$mapErr(fn)).toBe(ok);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$mapOr", () => {
    test("Returns Ok containing the mapped value", () => {
      const fn = vi.fn(() => "mapped");

      expect(Ok("test").$mapOr("default", fn).$unwrap()).toBe("mapped");
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Ok().$mapOr("default", fnThrow))).toBe(errThrow);
    });
  });

  describe("$mapOrElse", () => {
    test("Returns Ok containing the mapped value", () => {
      const fnDefault = vi.fn(() => "default");
      const fnMap = vi.fn(() => "mapped");

      expect(Ok("test").$mapOrElse(fnDefault, fnMap).$unwrap()).toBe("mapped");
      expect(fnDefault).not.toHaveBeenCalled();
      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the map function throws", () => {
      expect(capture(() => Ok().$mapOrElse(() => {}, fnThrow))).toBe(errThrow);
    });
  });

  describe("$or", () => {
    test("Returns itself", () => {
      const ok = Ok();

      expect(ok.$or(Ok())).toBe(ok);
    });
  });

  describe("$orElse", () => {
    test("Returns itself", () => {
      const ok = Ok();
      const fn = vi.fn(() => Ok());

      expect(ok.$orElse(fn)).toBe(ok);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$orSafe", () => {
    test("Returns itself", () => {
      const ok = Ok();
      const fn = vi.fn(() => Ok());

      expect(ok.$orSafe(fn)).toBe(ok);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$and", () => {
    test("Returns the Result", () => {
      const result = Ok();

      expect(Ok().$and(result)).toBe(result);
    });
  });

  describe("$andThen", () => {
    test("Returns the Result obtained by calling the function", () => {
      const result = Ok();
      const fn = vi.fn(() => result);

      expect(Ok("test").$andThen(fn)).toBe(result);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Ok().$andThen(fnThrow))).toBe(errThrow);
    });
  });

  describe("$andThrough", () => {
    test("Returns itself if the function returns Ok", () => {
      const ok = Ok("test");
      const fn = vi.fn(() => Ok());

      expect(ok.$andThrough(fn)).toBe(ok);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Returns the Err if the function returns Err", () => {
      const err = Err();
      const fn = vi.fn(() => err);

      expect(Ok("test").$andThrough(fn)).toBe(err);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Ok().$andThrough(fnThrow))).toBe(errThrow);
    });
  });

  describe("$andSafe", () => {
    test("Returns Ok if the function does not throw", () => {
      const fn = vi.fn(() => "value");

      expect(Ok("test").$andSafe(fn).$unwrap()).toBe("value");
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Returns Err if the function throws", () => {
      const fn = vi.fn(() => {
        throw errThrow;
      });

      expect(Ok("test").$andSafe(fn).$unwrapErr()).toBe(errThrow);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Replaces the error using the mapError function", () => {
      const fn = vi.fn(() => "test");

      expect(Ok().$andSafe(fnThrow, fn).$unwrapErr()).toBe("test");
      expect(fn).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    test("Replaces the error with RetupleThrownValueError if it is not an instance of Error, and if no mapError function is provided", () => {
      const fnThrowNonError = () => {
        throw "test";
      };

      expect(Ok().$andSafe(fnThrowNonError).$unwrapErr()).toBeInstanceOf(
        RetupleThrownValueError,
      );
      expect(Ok().$andSafe(fnThrowNonError).$unwrapErr()).toStrictEqual(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Throws the error when the mapError function throws", () => {
      expect(capture(() => Ok().$andSafe(fnThrow, fnThrow))).toBe(errThrow);
    });
  });

  describe("$peek", () => {
    test("Returns itself after calling the function", () => {
      const ok = Ok();
      const fn = vi.fn(() => {});

      expect(ok.$peek(fn)).toBe(ok);
      expect(fn).toHaveBeenCalledExactlyOnceWith(ok);
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Ok().$peek(fnThrow))).toBe(errThrow);
    });
  });

  describe("$tap", () => {
    test("Returns itself after calling the function with the contained value", () => {
      const ok = Ok("test");
      const fn = vi.fn(() => {});

      expect(ok.$tap(fn)).toBe(ok);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Ok().$tap(fnThrow))).toBe(errThrow);
    });
  });

  describe("$tapErr", () => {
    test("Returns itself", () => {
      const ok = Ok();
      const fn = vi.fn(() => {});

      expect(ok.$tapErr(fn)).toBe(ok);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$flatten", () => {
    test("Returns the contained value", () => {
      const okInner = Ok("test");
      const errInner = Err("test");

      expect(Ok(okInner).$flatten()).toBe(okInner);
      expect(Ok(errInner).$flatten()).toBe(errInner);
    });
  });

  describe("$async", () => {
    test("Returns ResultAsync which resolves to this instance", async () => {
      const ok = Ok();
      const okAsync = ok.$async();

      expect(okAsync).toBeInstanceOf(ResultAsync);
      await expect(okAsync).resolves.toBe(ok);
    });
  });

  describe("$promise", () => {
    test("Returns a promise which resolves to this instance", async () => {
      const ok = Ok();
      const okPromise = ok.$promise();

      expect(okPromise).toBeInstanceOf(Promise);
      await expect(okPromise).resolves.toBe(ok);
    });
  });
});
