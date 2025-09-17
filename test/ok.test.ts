import { vi, describe, it, expect } from "vitest";
import { capture, errThrow, fnThrow } from "./util.js";

import {
  Result,
  Ok,
  Err,
  RetupleUnwrapErrFailed,
  RetupleThrownValueError,
  RetupleFlattenFailed,
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

  describe("$andAssertOr", () => {
    it("should invoke the predicate/condition function with the contained value when provided", () => {
      const fnCond = vi.fn(() => true);

      Ok("test").$andAssertOr(Ok(), fnCond);

      expect(fnCond).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the predicate/condition function throws", () => {
      expect(capture(() => Ok().$andAssertOr(Ok(), fnThrow))).toBe(errThrow);
    });

    it("should return Ok with the contained value when the contained value is truthy, and when no predicate/condition function is provided", () => {
      expect(Ok("test").$andAssertOr(Ok())).toStrictEqual(Ok("test"));
    });

    it("should return Ok with the contained value when the predicate/condition function returns a truthy value", () => {
      expect(Ok("test").$andAssertOr(Ok(), () => true)).toStrictEqual(
        Ok("test"),
      );
      expect(Ok("test").$andAssertOr(Ok(), () => "truthy")).toStrictEqual(
        Ok("test"),
      );
    });

    it("should return the default Result when the contained value is falsey, and when no predicate/condition function is provided", () => {
      expect(Ok("").$andAssertOr(Ok("default"))).toStrictEqual(Ok("default"));
    });

    it("should return the default Result when the predicate/condition function returns a falsey value", () => {
      expect(Ok("test").$andAssertOr(Ok("default"), () => false)).toStrictEqual(
        Ok("default"),
      );

      expect(Ok("test").$andAssertOr(Ok("default"), () => "")).toStrictEqual(
        Ok("default"),
      );
    });
  });

  describe("$andAssertOrElse", () => {
    it("should invoke the default function with the contained value when the contained value is falsey, and when no predicate/condition function is provided", () => {
      const fnDefault = vi.fn(() => Ok());

      Ok("").$andAssertOrElse(fnDefault);

      expect(fnDefault).toHaveBeenCalledExactlyOnceWith("");
    });

    it("should invoke the default function with the contained value when the predicate/condition function returns false", () => {
      const fnDefault = vi.fn(() => Ok());

      Ok("test").$andAssertOrElse(fnDefault, () => false);

      expect(fnDefault).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should invoke the default function with the contained value when the predicate/condition function returns a falsey value", () => {
      const fnDefault = vi.fn(() => Ok());

      Ok("test").$andAssertOrElse(fnDefault, () => "");

      expect(fnDefault).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the default function throws", () => {
      expect(capture(() => Ok().$andAssertOrElse(fnThrow, () => false))).toBe(
        errThrow,
      );
    });

    it("should invoke the predicate/condition function with the contained value when provided", () => {
      const fnCond = vi.fn(() => true);

      Ok("test").$andAssertOrElse(() => Ok(), fnCond);

      expect(fnCond).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the predicate/condition function throws", () => {
      expect(capture(() => Ok().$andAssertOrElse(() => Ok(), fnThrow))).toBe(
        errThrow,
      );
    });

    it("should return Ok with the contained value when the contained value is truthy, and when no predicate/condition function is provided", () => {
      expect(Ok("test").$andAssertOrElse(() => Ok())).toStrictEqual(Ok("test"));
    });

    it("should return Ok with the contained value when the predicate/condition function returns a truthy value", () => {
      expect(
        Ok("test").$andAssertOrElse(
          () => Ok(),
          () => true,
        ),
      ).toStrictEqual(Ok("test"));

      expect(
        Ok("test").$andAssertOrElse(
          () => Ok(),
          () => "truthy",
        ),
      ).toStrictEqual(Ok("test"));
    });

    it("should return the default Result when the contained value is falsey, and when no predicate/condition function is provided", () => {
      expect(Ok("").$andAssertOrElse(() => Ok("default"))).toStrictEqual(
        Ok("default"),
      );
    });

    it("should return the default Result when the predicate/condition function returns a falsey value", () => {
      expect(
        Ok("test").$andAssertOrElse(
          () => Ok("default"),
          () => false,
        ),
      ).toStrictEqual(Ok("default"));

      expect(
        Ok("test").$andAssertOrElse(
          () => Ok("default"),
          () => "",
        ),
      ).toStrictEqual(Ok("default"));
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

    it("should map the error to RetupleThrownValueError when it is not an instance of Error, and when no map error function is provided", () => {
      expect(
        Ok().$andSafe(() => {
          throw "test";
        }),
      ).toStrictEqual(Err(new RetupleThrownValueError("test")));
    });

    it("should map the error with the map error function when provided", () => {
      expect(Ok().$andSafe(fnThrow, () => "test")).toStrictEqual(Err("test"));
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
    it("should throw RetupleFlattenFailed when the contained value is not Ok or Err", () => {
      expect(capture(() => Ok("test" as any).$flatten())).toStrictEqual(
        new RetupleFlattenFailed("test"),
      );
    });

    it("should return the contained Result", () => {
      expect(Ok(Ok("test")).$flatten()).toStrictEqual(Ok("test"));
      expect(Ok(Err("test")).$flatten()).toStrictEqual(Err("test"));
    });
  });

  describe("$async", () => {
    it("should return ResultAsync", async () => {
      const prototype = Object.getPrototypeOf(Result.$safeAsync(() => {}));

      expect(prototype).toBeTypeOf("object");
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

  describe("$tuple", () => {
    it("should return an equivalent tuple which is not an Ok instance", () => {
      expect(Ok("test").$tuple()).not.toStrictEqual(Ok("test"));
      expect(Ok("test").$tuple()).toStrictEqual([...Ok("test")]);
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
});
