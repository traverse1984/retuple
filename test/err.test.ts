import { vi, describe, test, expect } from "vitest";
import { ResultErr, ResultAsync } from "./internals.js";
import { capture, errThrow, fnThrow } from "./util.js";

import {
  Ok,
  Err,
  RetupleUnwrapFailed,
  RetupleExpectFailed,
  RetupleThrownValueError,
} from "../src/index.js";

describe("Err", () => {
  test("Returns an instance of ResultErr", () => {
    expect(Err()).toBeInstanceOf(ResultErr);
  });

  test("Is an array of length 2", () => {
    const err = Err();

    expect(err).toBeInstanceOf(Array);
    expect(err.length).toBe(2);
  });

  test("The first element is the value", () => {
    expect(Err("test")[0]).toBe("test");
  });

  test("The second element is undefined", () => {
    expect(Err("test")[1]).toBe(undefined);
  });

  test("When called with no arguments, the value is undefined", () => {
    expect(Err()[0]).toBe(undefined);
  });

  describe("$value", () => {
    test("Returns the contained value", () => {
      expect(Err("test").$value()).toBe("test");
    });
  });

  describe("$isOk", () => {
    test("Returns false", () => {
      expect(Err().$isOk()).toBe(false);
    });
  });

  describe("$isOkAnd", () => {
    test("Returns false", () => {
      const fn = vi.fn(() => true);

      expect(Err().$isOkAnd(fn)).toBe(false);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$isErr", () => {
    test("Returns true", () => {
      expect(Err().$isErr()).toBe(true);
    });
  });

  describe("$isErrAnd", () => {
    test("Returns the outcome of the predicate function", () => {
      const fn = vi.fn((value) => value === "test");

      expect(Err("test").$isErrAnd(fn)).toBe(true);
      expect(fn).toHaveBeenLastCalledWith("test");

      expect(Err("value").$isErrAnd(fn)).toBe(false);
      expect(fn).toHaveBeenLastCalledWith("value");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("Throws the error when the predicate function throws", () => {
      expect(capture(() => Err().$isErrAnd(fnThrow))).toBe(errThrow);
    });
  });

  describe("$expect", () => {
    test("Throws the contained value if it is an instance of Error", () => {
      expect(capture(() => Err(errThrow).$expect())).toBe(errThrow);
    });

    test("Throws RetupleExpectFailed if the contained value is not an instance of Error", () => {
      expect(() => Err<any>("test").$expect()).toThrow(RetupleExpectFailed);
      expect(() => Err<any>("test").$expect()).toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });
  });

  describe("$unwrap", () => {
    test("Throws RetupleUnwrapFailed", () => {
      expect(() => Err().$unwrap()).toThrow(RetupleUnwrapFailed);
      expect(() => Err("test").$unwrap()).toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Uses the custom message if provided", () => {
      expect(() => Err().$unwrap("Test error message")).toThrow(
        "Test error message",
      );
    });

    test("Populates the cause if the error is an instance of Error", () => {
      expect(() => Err(errThrow).$unwrap()).toThrow(
        expect.objectContaining({
          cause: errThrow,
        }),
      );
    });
  });

  describe("$unwrapErr", () => {
    test("Returns the contained value", () => {
      expect(Err("test").$unwrapErr()).toBe("test");
    });
  });

  describe("$unwrapOr", () => {
    test("Returns the default value", () => {
      expect(Err("test").$unwrapOr("default")).toBe("default");
    });
  });

  describe("$unwrapOrElse", () => {
    test("Returns the value obtained by calling the function", () => {
      const fn = vi.fn(() => "default");

      expect(Err("test").$unwrapOrElse(fn)).toBe("default");
      expect(fn).toHaveBeenCalledExactlyOnceWith();
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Err().$unwrapOrElse(fnThrow))).toBe(errThrow);
    });
  });

  describe("$map", () => {
    test("Returns itself", () => {
      const err = Err();
      const fn = vi.fn(() => "mapped");

      expect(err.$map(fn)).toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$mapErr", () => {
    test("Returns Err containing the mapped value", () => {
      const fn = vi.fn(() => "mapped");

      expect(Err("test").$mapErr(fn).$unwrapErr()).toBe("mapped");
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Err().$mapErr(fnThrow))).toBe(errThrow);
    });
  });

  describe("$mapOr", () => {
    test("Returns Ok containing the default value", () => {
      const fn = vi.fn(() => "mapped");

      expect(Err("test").$mapOr("default", fn).$unwrap()).toBe("default");
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$mapOrElse", () => {
    test("Returns Ok containing the value from the default function", () => {
      const fnDefault = vi.fn(() => "default");
      const fnMap = vi.fn(() => "mapped");

      expect(Err("test").$mapOrElse(fnDefault, fnMap).$unwrap()).toBe(
        "default",
      );
      expect(fnDefault).toHaveBeenCalledExactlyOnceWith("test");
      expect(fnMap).not.toHaveBeenCalled();
    });

    test("Throws the error when the default function throws", () => {
      expect(capture(() => Err().$mapOrElse(fnThrow, () => {}))).toBe(errThrow);
    });
  });

  describe("$or", () => {
    test("Returns the provided result", () => {
      const result = Ok();

      expect(Err().$or(result)).toBe(result);
    });
  });

  describe("$orElse", () => {
    test("Returns the Result obtained by calling the function", () => {
      const fn = vi.fn(() => Ok("value"));

      expect(Err("test").$orElse(fn).$unwrap()).toBe("value");
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Err().$orElse(fnThrow))).toBe(errThrow);
    });
  });

  describe("$orSafe", () => {
    test("Returns Ok if the function does not throw", () => {
      const fn = vi.fn(() => "value");

      expect(Err("test").$orSafe(fn).$unwrap()).toBe("value");
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Returns Err if the function throws", () => {
      const fn = vi.fn(() => {
        throw errThrow;
      });

      expect(Err("test").$orSafe(fn).$unwrapErr()).toBe(errThrow);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Replaces the error using the mapError function", () => {
      const fn = vi.fn(() => "test");

      expect(Err().$orSafe(fnThrow, fn).$unwrapErr()).toBe("test");
      expect(fn).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    test("Replaces the error with RetupleThrownValueError if it is not an instance of Error, and if no mapError function is provided", () => {
      const fnThrowNonError = () => {
        throw "test";
      };

      expect(Err().$orSafe(fnThrowNonError).$unwrapErr()).toBeInstanceOf(
        RetupleThrownValueError,
      );
      expect(Err().$orSafe(fnThrowNonError).$unwrapErr()).toStrictEqual(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Throws the error when the mapError function throws", () => {
      expect(capture(() => Err().$orSafe(fnThrow, fnThrow))).toBe(errThrow);
    });
  });

  describe("$and", () => {
    test("Returns itself", () => {
      const err = Err();

      expect(err.$and(Ok())).toBe(err);
    });
  });

  describe("$andThen", () => {
    test("Returns itself", () => {
      const err = Err();
      const fn = vi.fn(() => Ok());

      expect(err.$andThen(fn)).toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$andThrough", () => {
    test("Returns itself", () => {
      const err = Err();
      const fn = vi.fn(() => Ok());

      expect(err.$andThrough(fn)).toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$andSafe", () => {
    test("Returns itself", () => {
      const err = Err();
      const fn = vi.fn(() => Ok());

      expect(err.$andSafe(fn)).toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$peek", () => {
    test("Returns itself after calling the provided function with the Err", () => {
      const err = Err();
      const fn = vi.fn(() => {});

      expect(err.$peek(fn)).toBe(err);
      expect(fn).toHaveBeenCalledExactlyOnceWith(err);
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Err().$peek(fnThrow))).toBe(errThrow);
    });
  });

  describe("$tap", () => {
    test("Returns itself", () => {
      const err = Err();
      const fn = vi.fn(() => {});

      expect(err.$tap(fn)).toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$tapErr", () => {
    test("Returns itself after calling the function", () => {
      const err = Err("test");
      const fn = vi.fn(() => {});

      expect(err.$tapErr(fn)).toBe(err);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Throws the error when the function throws", () => {
      expect(capture(() => Err().$tapErr(fnThrow))).toBe(errThrow);
    });
  });

  describe("$flatten", () => {
    test("Returns itself", () => {
      const err = Err();

      expect(err.$flatten()).toBe(err);
    });
  });

  describe("$async", () => {
    test("Returns ResultAsync which resolves to this instance", async () => {
      const err = Err();
      const errAsync = err.$async();

      expect(errAsync).toBeInstanceOf(ResultAsync);
      await expect(errAsync).resolves.toBe(err);
    });
  });

  describe("$promise", () => {
    test("Returns a promise which resolves to this instance", async () => {
      const err = Err("test");
      const errPromise = err.$promise();

      expect(errPromise).toBeInstanceOf(Promise);
      await expect(errPromise).resolves.toBe(err);
    });
  });
});
