import { vi, describe, it, expect } from "vitest";
import { errThrow, errReject, fnThrow, fnReject } from "./util.js";

import {
  Ok,
  Err,
  RetupleUnwrapFailed,
  RetupleExpectFailed,
  RetupleThrownValueError,
} from "../src/index.js";

describe("ResultAsync (Err)", () => {
  describe("$expect", () => {
    it("should reject with the contained value when it is an instance of Error", async () => {
      await expect(Err(errReject).$async().$expect()).rejects.toBe(errReject);
    });

    it("should reject with RetupleExpectFailed when the contained value is not an instance of Error", async () => {
      await expect(Err<any>("test").$async().$expect()).rejects.toThrow(
        RetupleExpectFailed
      );
    });

    it("should include the contained value on the thrown RetupleExpectFailed", async () => {
      await expect(Err<any>("test").$async().$expect()).rejects.toThrow(
        expect.objectContaining({ value: "test" })
      );
    });
  });

  describe("$unwrap", () => {
    it("should reject with RetupleUnwrapFailed", async () => {
      await expect(Err("test").$async().$unwrap()).rejects.toThrow(
        RetupleUnwrapFailed
      );
    });

    it("should include the contained value on the reject RetupleUnwrapFailed", async () => {
      await expect(Err("test").$async().$unwrap()).rejects.toThrow(
        expect.objectContaining({ value: "test" })
      );
    });

    it("should include the cause on the rejected RetupleUnwrapFailed when the contained value is an instance of Error", async () => {
      await expect(Err(errThrow).$async().$unwrap()).rejects.toThrow(
        expect.objectContaining({
          cause: errThrow,
        })
      );
    });

    it("should use the custom error message for the rejected RetupleUnwrapFailed when provided", async () => {
      await expect(
        Err().$async().$unwrap("Test error message")
      ).rejects.toThrow("Test error message");
    });
  });

  describe("$unwrapErr", () => {
    it("should resolve to the contained value", async () => {
      await expect(Err("test").$async().$unwrapErr()).resolves.toBe("test");
    });
  });

  describe("$unwrapOr", () => {
    it("should resolve to the default value", async () => {
      await expect(Err("test").$async().$unwrapOr("default")).resolves.toBe(
        "default"
      );
    });
  });

  describe("$unwrapOrElse", () => {
    it("should invoke the default function with no arguments", async () => {
      const fnDefault = vi.fn(() => {});

      await Err().$async().$unwrapOrElse(fnDefault);

      expect(fnDefault).toHaveBeenCalledExactlyOnceWith();
    });

    it("should reject with the error when the default function throws", async () => {
      await expect(Err().$async().$unwrapOrElse(fnThrow)).rejects.toBe(
        errThrow
      );
    });

    it("should resolve to the default value", async () => {
      await expect(
        Err()
          .$async()
          .$unwrapOrElse(() => "default")
      ).resolves.toBe("default");
    });
  });

  describe("$map", () => {
    it("should not invoke the map function", async () => {
      const fnMap = vi.fn(() => {});

      await Err().$async().$map(fnMap);

      expect(fnMap).not.toHaveBeenCalled();
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(
        Err("test")
          .$async()
          .$map(() => "mapped")
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$mapErr", () => {
    it("should invoke the map error function with the contained value", async () => {
      const fnMapErr = vi.fn(() => {});

      await Err("test").$async().$mapErr(fnMapErr);

      expect(fnMapErr).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the map erro function throws", async () => {
      await expect(Err().$async().$mapErr(fnThrow)).rejects.toBe(errThrow);
    });

    it("should resolve to Err containing the mapped value", async () => {
      await expect(
        Err("test")
          .$async()
          .$mapErr(() => "mapped")
          .$unwrapErr()
      ).resolves.toBe("mapped");
    });
  });

  describe("$mapOr", () => {
    it("should not invoke the map function", async () => {
      const fnMap = vi.fn(() => {});

      await Err().$async().$mapOr("default", fnMap);

      expect(fnMap).not.toHaveBeenCalled();
    });

    it("should resolve to Ok containing the default value", async () => {
      await expect(
        Err("test")
          .$async()
          .$mapOr("default", () => "mapped")
          .$unwrap()
      ).resolves.toBe("default");
    });
  });

  describe("$mapOrElse", () => {
    describe("Err", () => {
      it("should invoke the default function with the contained value", async () => {
        const fnDefault = vi.fn(() => {});

        await Err("test")
          .$async()
          .$mapOrElse(fnDefault, () => {});

        expect(fnDefault).toHaveBeenCalledExactlyOnceWith("test");
      });

      it("should reject when the default function throws", async () => {
        await expect(
          Err()
            .$async()
            .$mapOrElse(fnThrow, () => {})
        ).rejects.toBe(errThrow);
      });

      it("should not invoke the map function", async () => {
        const fnMap = vi.fn(() => {});

        await Err()
          .$async()
          .$mapOrElse(() => {}, fnMap);

        expect(fnMap).not.toHaveBeenCalled();
      });

      it("should resolve to Ok containing the value from the default function", async () => {
        await expect(
          Err("test")
            .$async()
            .$mapOrElse(
              () => "default",
              () => "mapped"
            )
            .$unwrap()
        ).resolves.toBe("default");
      });
    });
  });

  describe("$assertOr", () => {
    it("should not invoke the predicate/condition function", async () => {
      const fnCond = vi.fn(() => true);

      await Err().$async().$assertOr(Ok(), fnCond);

      expect(fnCond).not.toHaveBeenCalled();
    });

    it("should not reject when the default promise rejects", async () => {
      const rejected = fnReject();

      await expect(
        Err("test")
          .$async()
          .$assertOr(rejected, () => true)
      ).resolves.toStrictEqual(Err("test"));
      await rejected.catch(() => {});
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(Err("test").$async().$assertOr(Ok())).resolves.toStrictEqual(
        Err("test")
      );
    });
  });

  describe("$assertOrElse", () => {
    it("should not invoke the default function", async () => {
      const fnDefault = vi.fn(() => Ok());

      await Err()
        .$async()
        .$assertOrElse(fnDefault, () => false);

      expect(fnDefault).not.toHaveBeenCalled();
    });

    it("should not invoke the predicate/condition function", async () => {
      const fnCond = vi.fn(() => true);

      await Err().$async().$assertOr(Ok(), fnCond);

      expect(fnCond).not.toHaveBeenCalled();
    });

    it("should not reject when the default promise rejects", async () => {
      const rejected = fnReject();

      await expect(
        Err("test")
          .$async()
          .$assertOr(rejected, () => true)
      ).resolves.toStrictEqual(Err("test"));

      await rejected.catch(() => {});
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(
        Err("test")
          .$async()
          .$assertOrElse(
            () => Ok(),
            () => true
          )
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$or", () => {
    it("should reject when the promise rejects", async () => {
      await expect(Err().$async().$or(fnReject())).rejects.toBe(errReject);
    });

    it("should resolve to the or Result", async () => {
      await expect(Err().$async().$or(Ok("test"))).resolves.toStrictEqual(
        Ok("test")
      );

      await expect(
        Err().$async().$or(Ok("test").$async())
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Err()
          .$async()
          .$or(Promise.resolve(Ok("test")))
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$orElse", () => {
    it("should invoke the or function with the contained value", async () => {
      const fnOr = vi.fn(() => Ok());

      await Err("test").$async().$orElse(fnOr);

      expect(fnOr).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the or function throws", async () => {
      await expect(Err().$async().$orElse(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject with the error when the or function rejects", async () => {
      await expect(Err().$async().$orElse(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to the or Result", async () => {
      await expect(
        Err()
          .$async()
          .$orElse(() => Ok("test"))
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Err()
          .$async()
          .$orElse(() => Ok("test"))
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$orSafe", () => {
    it("should invoke the safe function with the contained value", async () => {
      const fnSafe = vi.fn(() => "value");

      await Err("test").$async().$orSafe(fnSafe);

      expect(fnSafe).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should invoke the map error function with the thrown value when the safe function throws", async () => {
      const fnMapError = vi.fn(() => {});

      await Err().$async().$orSafe(fnThrow, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    it("should invoke the map error function with the rejected value when the safe function rejects", async () => {
      const fnMapError = vi.fn(() => {});

      await Err().$async().$orSafe(fnReject, fnMapError);

      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errReject);
    });

    it("should reject when the map error function throws", async () => {
      await expect(Err().$async().$orSafe(fnReject, fnThrow)).rejects.toBe(
        errThrow
      );
    });

    it("should resolve to Ok with the safe value", async () => {
      await expect(
        Err()
          .$async()
          .$orSafe(() => "test")
      ).resolves.toStrictEqual(Ok("test"));

      await expect(
        Err()
          .$async()
          .$orSafe(async () => "test")
      ).resolves.toStrictEqual(Ok("test"));
    });

    it("should resolve to Err with the thrown/rejected error when the safe function throws or rejects", async () => {
      await expect(
        Err("test").$async().$orSafe(fnThrow)
      ).resolves.toStrictEqual(Err(errThrow));

      await expect(
        Err("test").$async().$orSafe(fnReject)
      ).resolves.toStrictEqual(Err(errReject));
    });

    it("should map the error to RetupleThrownValueError when it is not an instance of Error, and when no map error function is provided", async () => {
      await expect(
        Err()
          .$async()
          .$orSafe(() => {
            throw "test";
          })
      ).resolves.toStrictEqual(Err(new RetupleThrownValueError("test")));

      await expect(
        Err()
          .$async()
          .$orSafe(async () => {
            throw "test";
          })
      ).resolves.toStrictEqual(Err(new RetupleThrownValueError("test")));
    });

    it("should map the error with the map error function when provided", async () => {
      await expect(
        Err()
          .$async()
          .$orSafe(fnThrow, () => "test")
      ).resolves.toStrictEqual(Err("test"));

      await expect(
        Err()
          .$async()
          .$orSafe(fnReject, () => "test")
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$and", () => {
    it("should not reject when the and promise rejects", async () => {
      const rejected = fnReject();

      await expect(Err("test").$async().$and(rejected)).resolves.toStrictEqual(
        Err("test")
      );

      await rejected.catch(() => {});
    });

    it("should return Err with the contained value", async () => {
      await expect(Err("test").$async().$and(Ok())).resolves.toStrictEqual(
        Err("test")
      );
    });
  });

  describe("$andThen", () => {
    it("should not invoke the and function", async () => {
      const fnAnd = vi.fn(() => Ok());

      await Err().$async().$andThen(fnAnd);

      expect(fnAnd).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", async () => {
      await expect(Err("test").$async().$and(Ok())).resolves.toStrictEqual(
        Err("test")
      );
    });
  });

  describe("$andThrough", () => {
    it("should not invoke the through function", async () => {
      const fnThrough = vi.fn(() => Ok());

      await Err().$async().$andThrough(fnThrough);

      expect(fnThrough).not.toHaveBeenCalled();
    });

    it("should return Err with the contained value", async () => {
      await expect(Err("test").$async().$and(Ok())).resolves.toStrictEqual(
        Err("test")
      );
    });
  });

  describe("$andSafe", () => {
    it("should not invoke the safe function", async () => {
      const fnSafe = vi.fn(() => {});

      await Err().$async().$andSafe(fnSafe);

      expect(fnSafe).not.toHaveBeenCalled();
    });

    it("should not invoke the map error function", async () => {
      const fnMapError = vi.fn(() => {});

      await Err().$async().$andSafe(fnThrow, fnMapError);
      await Err().$async().$andSafe(fnReject, fnMapError);

      expect(fnMapError).not.toHaveBeenCalled();
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(
        Err("test")
          .$async()
          .$andSafe(() => {})
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$peek", () => {
    it("should invoke the peek function with the current Result", async () => {
      let calledWithValue: any;
      const fnPeek = vi.fn((value) => (calledWithValue = value));

      await Err("test").$async().$peek(fnPeek);

      expect(fnPeek).toHaveBeenCalledTimes(1);
      expect(calledWithValue).toStrictEqual(Err("test"));
    });

    it("should reject when the peek function throws", async () => {
      await expect(Err().$async().$peek(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the peek function rejects", async () => {
      await expect(Err().$async().$peek(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(
        Err("test")
          .$async()
          .$peek(() => {})
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$tap", () => {
    it("should not invoke the tap function", async () => {
      const fnTap = vi.fn(() => {});

      await Err().$async().$tap(fnTap);

      expect(fnTap).not.toHaveBeenCalled();
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Ok("test")
          .$async()
          .$tap(() => {})
      ).resolves.toStrictEqual(Ok("test"));
    });
  });

  describe("$tapErr", () => {
    it("should invoke the tap error function with the contained value", async () => {
      const fnTapErr = vi.fn(() => {});

      await Err("test").$async().$tapErr(fnTapErr);

      expect(fnTapErr).toHaveBeenCalledExactlyOnceWith("test");
    });

    it("should reject when the tap error function throws", async () => {
      await expect(Err().$async().$tapErr(fnThrow)).rejects.toBe(errThrow);
    });

    it("should reject when the tap error function rejects", async () => {
      await expect(Err().$async().$tapErr(fnReject)).rejects.toBe(errReject);
    });

    it("should resolve to Ok with the contained value", async () => {
      await expect(
        Err("test")
          .$async()
          .$tapErr(() => {})
      ).resolves.toStrictEqual(Err("test"));
    });
  });

  describe("$promise", () => {
    it("should return a Promise", () => {
      expect(Err().$async().$promise()).toBeInstanceOf(Promise);
    });

    it("should resolve to Err with the contained value", async () => {
      await expect(Err("test").$async().$promise()).resolves.toStrictEqual(
        Err("test")
      );
    });
  });
});
