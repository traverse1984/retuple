import { vi, describe, it, expect } from "vitest";
import { capture, errThrow, fnThrow } from "./util.js";

import {
  Ok,
  Err,
  safeAsync,
  RetupleUnwrapFailed,
  RetupleExpectFailed,
  RetupleThrownValueError,
} from "../src/index.js";

describe("Err", () => {
  it("should be an instance of Array", () => {
    expect(Err()).toBeInstanceOf(Array);
  });

  it("should have two elements", () => {
    expect(Err().length).toBe(2);
  });

  it("should have the contained value at index 0", () => {
    expect(Err("test")[0]).toBe("test");
  });

  it("should have undefined at index 1", () => {
    expect(Err("test")[1]).toBe(undefined);
  });

  it("should use undefined as the contained value when constructed without arguments", () => {
    expect(Err()[0]).toBe(undefined);
  });

  it("should JSON stringify to null", () => {
    expect(JSON.stringify(Err())).toBe(JSON.stringify(null));
    expect(JSON.stringify(Err(null))).toBe(JSON.stringify(null));
    expect(JSON.stringify(Err(NaN))).toBe(JSON.stringify(null));
    expect(JSON.stringify(Err("test"))).toBe(JSON.stringify(null));
    expect(JSON.stringify(Err([1, 2, 3]))).toBe(JSON.stringify(null));
    expect(JSON.stringify(Err({ a: 1, b: 2 }))).toBe(JSON.stringify(null));
  });

  describe("$toNativeTuple", () => {
    it("should return an equivalent tuple which is not an Err instance", () => {
      expect(Err("test").$toNativeTuple()).not.toStrictEqual(Err("test"));
      expect(Err("test").$toNativeTuple()).toStrictEqual([...Err("test")]);
    });
  });

  describe("$value", () => {
    it("should return the contained value", () => {
      expect(Err("test").$value()).toBe("test");
    });
  });

  describe("$isOk", () => {
    it("should return false", () => {
      expect(Err().$isOk()).toBe(false);
    });
  });

  describe("$isOkAnd", () => {
    it("should not invoke the predicate/condition function", () => {
      const fnCond = vi.fn(() => {});

      Err().$isOkAnd(fnCond);

      expect(fnCond).not.toHaveBeenCalled();
    });

    it("should return false", () => {
      expect(Err().$isOkAnd(() => true)).toBe(false);
    });
  });

  describe("$isErr", () => {
    it("should return true", () => {
      expect(Err().$isErr()).toBe(true);
    });
  });

  describe("$isErrAnd", () => {
    it("should invoke the predicate/condition function with the contained value", () => {
      const fnCond = vi.fn(() => {});

      Err("test").$isErrAnd(fnCond);

      expect(fnCond).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the predicate/condition function throws", () => {
      expect(capture(() => Err().$isErrAnd(fnThrow))).toBe(errThrow);
    });

    it("should return true when the predicate/condition function returns a truthy value", () => {
      expect(Err("test").$isErrAnd((val) => val === "test")).toBe(true);
      expect(Err<string>("test").$isErrAnd((val) => val !== "test")).toBe(
        false
      );

      expect(Err().$isErrAnd(() => "truthy")).toBe(true);
      expect(Err().$isErrAnd(() => "")).toBe(false);
    });

    it("should return false when the predicate/condition function returns a falsey value", () => {
      expect(Err<string>("test").$isErrAnd((val) => val !== "test")).toBe(
        false
      );
      expect(Err().$isErrAnd(() => "")).toBe(false);
    });
  });

  describe("$expect", () => {
    it("should throw the contained value when it is an instance of Error", () => {
      expect(capture(() => Err(errThrow).$expect())).toBe(errThrow);
    });

    it("should throw RetupleExpectFailed when the contained value is not an instance of Error", () => {
      expect(() => Err<any>("test").$expect()).toThrow(RetupleExpectFailed);
    });

    it("should include the contained value on the thrown RetupleExpectFailed", () => {
      expect(() => Err<any>("test").$expect()).toThrow(
        expect.objectContaining({ value: "test" })
      );
    });
  });

  describe("$unwrap", () => {
    it("should throw RetupleUnwrapFailed", () => {
      expect(() => Err().$unwrap()).toThrow(RetupleUnwrapFailed);
    });

    it("should include the contained value on the thrown RetupleUnwrapFailed", () => {
      expect(() => Err("test").$unwrap()).toThrow(
        expect.objectContaining({ value: "test" })
      );
    });

    it("should include the cause on the thrown RetupleUnwrapFailed when the contained value is an instance of Error", () => {
      expect(() => Err(errThrow).$unwrap()).toThrow(
        expect.objectContaining({
          cause: errThrow,
        })
      );
    });

    it("should use the custom error message for the thrown RetupleUnwrapFailed when provided", () => {
      expect(() => Err().$unwrap("Test error message")).toThrow(
        "Test error message"
      );
    });
  });

  describe("$unwrapErr", () => {
    it("should return the contained value", () => {
      expect(Err("test").$unwrapErr()).toBe("test");
    });
  });

  describe("$unwrapOr", () => {
    it("should return the default value", () => {
      expect(Err("test").$unwrapOr("default")).toBe("default");
    });
  });

  describe("$unwrapOrElse", () => {
    it("should invoke the default function with no arguments", () => {
      const fnDefault = vi.fn(() => {});

      Err().$unwrapOrElse(fnDefault);

      expect(fnDefault).toHaveBeenCalledExactlyOnceWith();
    });

    it("should throw when the default function throws", () => {
      expect(capture(() => Err().$unwrapOrElse(fnThrow))).toBe(errThrow);
    });

    it("should return the default value", () => {
      expect(Err().$unwrapOrElse(() => "default")).toBe("default");
    });
  });

  describe("$map", () => {
    it("should not invoke the map function", () => {
      const fnMap = vi.fn(() => {});

      Err().$map(fnMap);

      expect(fnMap).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", () => {
      expect(Err("test").$map(() => {})).toStrictEqual(Err("test"));
    });
  });

  describe("$mapErr", () => {
    it("should invoke the map error function with the contained value", () => {
      const fnMapErr = vi.fn(() => {});

      Err("test").$mapErr(fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the map error function throws", () => {
      expect(capture(() => Err().$mapErr(fnThrow))).toBe(errThrow);
    });

    it("should return Err containing the mapped value", () => {
      expect(Err("test").$mapErr(() => "mapped")).toStrictEqual(Err("mapped"));
    });
  });

  describe("$mapOr", () => {
    it("should not invoke the map function", () => {
      const fnMap = vi.fn(() => {});

      Err().$mapOr("default", fnMap);

      expect(fnMap).not.toHaveBeenCalled();
    });

    it("should return Ok containing the default value", () => {
      expect(Err().$mapOr("default", () => "mapped")).toStrictEqual(
        Ok("default")
      );
    });
  });

  describe("$mapOrElse", () => {
    it("should invoke the default function with the contained value", () => {
      const fnDefault = vi.fn(() => {});

      Err("test").$mapOrElse(fnDefault, () => {});

      expect(fnDefault).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the default function throws", () => {
      expect(capture(() => Err().$mapOrElse(fnThrow, () => {}))).toBe(errThrow);
    });

    it("should not invoke the map function", () => {
      const fnMap = vi.fn(() => {});

      Err().$mapOrElse(() => {}, fnMap);

      expect(fnMap).not.toHaveBeenCalled();
    });

    it("should return Ok containing the default value", () => {
      expect(
        Err().$mapOrElse(
          () => "default",
          () => "mapped"
        )
      ).toStrictEqual(Ok("default"));
    });
  });

  describe("$assertOr", () => {
    it("should not invoke the predicate/condition function", () => {
      const fnCond = vi.fn(() => true);

      Err().$assertOr(Ok(), fnCond);

      expect(fnCond).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", () => {
      expect(Err("test").$assertOr(Ok(), () => true)).toStrictEqual(
        Err("test")
      );
    });
  });

  describe("$assertOrElse", () => {
    it("should not invoke the default function", () => {
      const fnDefault = vi.fn(() => Ok());

      Err().$assertOrElse(fnDefault, () => true);

      expect(fnDefault).not.toHaveBeenCalled();
    });

    it("should not invoke the predicate/condition function", () => {
      const fnCond = vi.fn(() => true);

      Err().$assertOrElse(() => Ok(), fnCond);

      expect(fnCond).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", () => {
      expect(
        Err("test").$assertOrElse(
          () => Ok(),
          () => true
        )
      ).toStrictEqual(Err("test"));
    });
  });

  describe("$or", () => {
    it("should return the or Result", () => {
      expect(Err().$or(Ok("test"))).toStrictEqual(Ok("test"));
    });
  });

  describe("$orElse", () => {
    it("should invoke the or function with the contained value", () => {
      const fnOr = vi.fn(() => Ok());

      Err("test").$orElse(fnOr);

      expect(fnOr).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the or function throws", () => {
      expect(capture(() => Err().$orElse(fnThrow))).toBe(errThrow);
    });

    it("should return the or Result", () => {
      expect(Err().$orElse(() => Ok("test"))).toStrictEqual(Ok("test"));
    });
  });

  describe("$orSafe", () => {
    it("should invoke the safe function with the contained value", () => {
      const fnSafe = vi.fn(() => "value");

      Err("test").$orSafe(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should invoke the map error function with the thrown value when the safe function throws", () => {
      const fnMapError = vi.fn(() => {});

      Err().$orSafe(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should throw when the map error function throws", () => {
      expect(
        capture(() =>
          Err().$orSafe(() => {
            throw new Error();
          }, fnThrow)
        )
      ).toBe(errThrow);
    });

    it("should return Ok with the safe function return value", () => {
      expect(Err().$orSafe(() => "test")).toStrictEqual(Ok("test"));
    });

    it("should return Err with the thrown error when the safe function throws an instance of Error, and when no map error function is provided", () => {
      expect(Err().$orSafe(fnThrow)).toStrictEqual(Err(errThrow));
    });

    it("should map the Err to RetupleThrownValueError when the thrown error is not an instance of Error, and when no map error function is provided", () => {
      expect(
        Err().$orSafe(() => {
          throw "test";
        })
      ).toStrictEqual(Err(new RetupleThrownValueError("test")));
    });

    it("should map the Err with the map error function when provided", () => {
      expect(Err().$orSafe(fnThrow, () => "test")).toStrictEqual(Err("test"));
    });
  });

  describe("$and", () => {
    it("should return Err with the contained value", () => {
      expect(Err("test").$and(Ok())).toStrictEqual(Err("test"));
    });
  });

  describe("$andThen", () => {
    it("should not invoke the and function", () => {
      const fnAnd = vi.fn(() => Ok());

      Err().$andThen(fnAnd);

      expect(fnAnd).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", () => {
      expect(Err("test").$andThen(() => Ok())).toStrictEqual(Err("test"));
    });
  });

  describe("$andThrough", () => {
    it("should not invoke the through function", () => {
      const fnThrough = vi.fn(() => Err());

      Err().$andThrough(fnThrough);

      expect(fnThrough).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", () => {
      expect(Err("test").$andThrough(() => Err())).toStrictEqual(Err("test"));
    });
  });

  describe("$andSafe", () => {
    it("should not invoke the safe function", () => {
      const fnSafe = vi.fn(() => Ok());

      Err().$andSafe(fnSafe);

      expect(fnSafe).not.toHaveBeenCalled();
    });

    it("should not invoke the map error function", () => {
      const fnMapError = vi.fn(() => {});

      Err().$andSafe(fnThrow, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", () => {
      expect(
        Err("test").$andSafe(
          () => Ok(),
          () => "mapped"
        )
      ).toStrictEqual(Err("test"));
    });
  });

  describe("$peek", () => {
    it("should invoke the peek function with Err containing the contained value", () => {
      let calledWithValue: any;
      const fnPeek = vi.fn((value) => (calledWithValue = value));

      Err("test").$peek(fnPeek);

      expect(fnPeek).toHaveBeenCalledTimes(1);
      expect(calledWithValue).toStrictEqual(Err("test"));
    });

    it("should throw when the peek function throws", () => {
      expect(capture(() => Err().$peek(fnThrow))).toBe(errThrow);
    });

    it("should return Err with the contained value", () => {
      expect(Err("test").$peek(() => {})).toStrictEqual(Err("test"));
    });
  });

  describe("$tap", () => {
    it("should not invoke the tap function", () => {
      const fnTap = vi.fn(() => {});

      Err().$tap(fnTap);

      expect(fnTap).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", () => {
      expect(Err("test").$tap(() => {})).toStrictEqual(Err("test"));
    });
  });

  describe("$tapErr", () => {
    it("should invoke the tap error function with the contained value", () => {
      const fnTapErr = vi.fn(() => {});

      Err("test").$tapErr(fnTapErr);

      expect(fnTapErr).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should throw when the tap error function throws", () => {
      expect(capture(() => Err().$tapErr(fnThrow))).toBe(errThrow);
    });

    it("should return Err with the contained value", () => {
      expect(Err("test").$tapErr(() => {})).toStrictEqual(Err("test"));
    });
  });

  describe("$flatten", () => {
    it("should return Err with the contained value", () => {
      expect(Err("test").$flatten()).toStrictEqual(Err("test"));
    });
  });

  describe("$async", () => {
    it("should return ResultAsync", async () => {
      const prototype = Object.getPrototypeOf(safeAsync(() => {}));

      expect(prototype).toBeTypeOf("object");
      expect(Err().$async()).toBeInstanceOf(prototype.constructor);
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(Err("test").$async()).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$promise", () => {
    it("should return a Promise", () => {
      expect(Err().$promise()).toBeInstanceOf(Promise);
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(Err("test").$promise()).resolves.toStrictEqual(Err("test"));
    });
  });
});
