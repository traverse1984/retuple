import { vi, describe, test, expect } from "vitest";
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
    test("Rejects with the contained value if it is an instance of Error", async () => {
      await expect(Err(errReject).$async().$expect()).rejects.toBe(errReject);
    });

    test("Rejects with RetupleExpectFailed if the contained value is not an instance of Error", async () => {
      await expect(Err<any>("test").$async().$expect()).rejects.toThrow(
        RetupleExpectFailed,
      );
      await expect(Err<any>("test").$async().$expect()).rejects.toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });
  });

  describe("$unwrap", () => {
    test("Rejects with RetupleUnwrapFailed", async () => {
      await expect(Err("test").$async().$unwrap()).rejects.toThrow(
        RetupleUnwrapFailed,
      );
      await expect(Err("test").$async().$unwrap()).rejects.toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Uses the custom message if provided", async () => {
      await expect(
        Err("test").$async().$unwrap("Test error message"),
      ).rejects.toThrow("Test error message");
    });

    test("Populates the cause if the error is an instance of Error", async () => {
      await expect(Err(errReject).$async().$unwrap()).rejects.toThrow(
        expect.objectContaining({
          cause: errReject,
        }),
      );
    });
  });

  describe("$unwrapErr", () => {
    test("Resolves to the contained value", async () => {
      await expect(Err("test").$async().$unwrapErr()).resolves.toBe("test");
    });
  });

  describe("$unwrapOr", () => {
    test("Resolves to the default value", async () => {
      await expect(Err("test").$async().$unwrapOr("default")).resolves.toBe(
        "default",
      );
    });
  });

  describe("$unwrapOrElse", () => {
    test("Resolves to the value obtained by calling the function", async () => {
      const fn = vi.fn(() => "default");

      await expect(Err("test").$async().$unwrapOrElse(fn)).resolves.toBe(
        "default",
      );
      expect(fn).toHaveBeenCalledExactlyOnceWith();
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Err().$async().$unwrapOrElse(fnThrow)).rejects.toBe(
        errThrow,
      );
    });
  });

  describe("$map", () => {
    test("Resolves to itself", async () => {
      const err = Err();
      const fn = vi.fn(() => "mapped");

      await expect(err.$async().$map(fn)).resolves.toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$mapErr", () => {
    test("Resolves to Err containing the mapped value", async () => {
      const fn = vi.fn(() => "mapped");

      await expect(Err("test").$async().$mapErr(fn).$unwrapErr()).resolves.toBe(
        "mapped",
      );
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Err().$async().$mapErr(fnThrow)).rejects.toBe(errThrow);
    });
  });

  describe("$mapOr", () => {
    test("Resolves to Ok containing the default value", async () => {
      const fn = vi.fn(() => "mapped");

      await expect(
        Err("test").$async().$mapOr("default", fn).$unwrap(),
      ).resolves.toBe("default");
    });
  });

  describe("$mapOrElse", () => {
    describe("Err", () => {
      test("Resolves to Ok containing the value from the default function", async () => {
        const fnDefault = vi.fn(() => "default");
        const fnMap = vi.fn(() => "mapped");

        await expect(
          Err("test").$async().$mapOrElse(fnDefault, fnMap).$unwrap(),
        ).resolves.toBe("default");
        expect(fnDefault).toHaveBeenCalledExactlyOnceWith("test");
        expect(fnMap).not.toHaveBeenCalled();
      });

      test("Rejects with the error when the default function throws", async () => {
        await expect(
          Err()
            .$async()
            .$mapOrElse(fnThrow, () => {}),
        ).rejects.toBe(errThrow);
      });
    });
  });

  describe("$or", () => {
    describe("Err", () => {
      test("Resolves to the provided Result", async () => {
        const result = Ok();

        await expect(Err().$async().$or(result)).resolves.toBe(result);
        await expect(Err().$async().$or(result.$async())).resolves.toBe(result);
        await expect(Err().$async().$or(Promise.resolve(result))).resolves.toBe(
          result,
        );
      });

      test("Rejects with the error if the promise rejects", async () => {
        await expect(Err().$async().$or(fnReject())).rejects.toBe(errReject);
      });
    });
  });

  describe("$orElse", () => {
    describe("Err", () => {
      test("Resolves to the Result obtained by calling the function", async () => {
        const result = Ok();
        const fnSync = vi.fn(() => result);
        const fnAsync = vi.fn(async () => result);

        await expect(Err("test").$async().$orElse(fnSync)).resolves.toBe(
          result,
        );
        expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

        await expect(Err("test").$async().$orElse(fnAsync)).resolves.toBe(
          result,
        );
        expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
      });

      test("Rejects with the error when the function throws", async () => {
        await expect(Err().$async().$orElse(fnThrow)).rejects.toBe(errThrow);
      });

      test("Rejects with the error when the function returns a rejecting promise", async () => {
        await expect(Err().$async().$orElse(fnReject)).rejects.toBe(errReject);
      });
    });
  });

  describe("$orSafe", () => {
    test("Resolves to Ok if the function does not throw/reject", async () => {
      const fnSync = vi.fn(() => "value");
      const fnAsync = vi.fn(async () => "value");

      await expect(
        Err("test").$async().$orSafe(fnSync).$unwrap(),
      ).resolves.toBe("value");
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(
        Err("test").$async().$orSafe(fnAsync).$unwrap(),
      ).resolves.toBe("value");
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Resolves to Err if the function throws/rejects", async () => {
      const fnSync = vi.fn(() => {
        throw errThrow;
      });
      const fnAsync = vi.fn(async () => {
        throw errReject;
      });

      await expect(
        Err("test").$async().$orSafe(fnSync).$unwrapErr(),
      ).resolves.toBe(errThrow);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(
        Err("test").$async().$orSafe(fnAsync).$unwrapErr(),
      ).resolves.toBe(errReject);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Replaces the error value using the mapError function", async () => {
      const fn = vi.fn(() => "test");

      await expect(
        Err("test").$async().$orSafe(fnThrow, fn).$unwrapErr(),
      ).resolves.toBe("test");
      expect(fn).toHaveBeenLastCalledWith(errThrow);

      await expect(
        Err("test").$async().$orSafe(fnReject, fn).$unwrapErr(),
      ).resolves.toBe("test");
      expect(fn).toHaveBeenLastCalledWith(errReject);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("Replaces the error with RetupleThrownValueError if it is not an instance of Error, and if no mapError function is provided", async () => {
      const fnThrowNonError = () => {
        throw "test";
      };

      await expect(
        Err().$async().$orSafe(fnThrowNonError).$unwrapErr(),
      ).resolves.toBeInstanceOf(RetupleThrownValueError);
      await expect(
        Err().$async().$orSafe(fnThrowNonError).$unwrapErr(),
      ).resolves.toStrictEqual(expect.objectContaining({ value: "test" }));
    });

    test("Rejects with the error when the mapError function throws", async () => {
      await expect(Err().$async().$orSafe(fnReject, fnThrow)).rejects.toBe(
        errThrow,
      );
    });
  });

  describe("$and", () => {
    describe("Err", () => {
      test("Resolves to itself", async () => {
        const err = Err();

        await expect(err.$async().$and(Ok())).resolves.toBe(err);
        await expect(err.$async().$and(Ok().$async())).resolves.toBe(err);
        await expect(err.$async().$and(Promise.resolve(Ok()))).resolves.toBe(
          err,
        );
      });

      test("Does not reject if the promise rejects", async () => {
        const err = Err();
        const rejected = fnReject();

        await expect(err.$async().$and(rejected)).resolves.toBe(err);
        await rejected.catch(() => {});
      });
    });
  });

  describe("$andThen", () => {
    describe("Err", () => {
      test("Resolves to itself", async () => {
        const err = Err();
        const fn = vi.fn(() => Ok());

        await expect(err.$async().$andThen(fn)).resolves.toBe(err);
        expect(fn).not.toHaveBeenCalled();
      });
    });
  });

  describe("$andThrough", () => {
    test("Resolves to itself", async () => {
      const err = Err();
      const fn = vi.fn(() => Ok());

      await expect(err.$async().$andThrough(fn)).resolves.toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$andSafe", () => {
    test("Returns itself", async () => {
      const err = Err();
      const fn = vi.fn(() => {});
      const fnMapError = vi.fn(() => {});

      await expect(err.$async().$andSafe(fn, fnMapError)).resolves.toBe(err);
      expect(fn).not.toHaveBeenCalled();
      expect(fnMapError).not.toHaveBeenCalled();
    });
  });

  describe("$peek", () => {
    test("Resolves to itself after calling the function with the Ok", async () => {
      const err = Err();
      const fnSync = vi.fn(() => {});
      const fnAsync = vi.fn(async () => {});

      await expect(err.$async().$peek(fnSync)).resolves.toBe(err);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith(err);

      await expect(err.$async().$peek(fnAsync)).resolves.toBe(err);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith(err);
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Err().$async().$peek(fnThrow)).rejects.toBe(errThrow);
    });

    test("Rejects with the error when the function returns a rejecting promise", async () => {
      await expect(Err().$async().$peek(fnReject)).rejects.toBe(errReject);
    });
  });

  describe("$tap", () => {
    test("Resolves to itself", async () => {
      const err = Err();
      const fn = vi.fn(() => {});

      await expect(err.$async().$tap(fn)).resolves.toBe(err);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$tapErr", () => {
    test("Resolves to itself after calling the function", async () => {
      const err = Err("test");
      const fnSync = vi.fn(() => {});
      const fnAsync = vi.fn(async () => {});

      await expect(err.$async().$tapErr(fnSync)).resolves.toBe(err);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(err.$async().$tapErr(fnAsync)).resolves.toBe(err);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Err().$async().$tapErr(fnThrow)).rejects.toBe(errThrow);
    });

    test("Rejects with the error when the function returns a rejecting promise", async () => {
      await expect(Err().$async().$tapErr(fnReject)).rejects.toBe(errReject);
    });
  });

  describe("$promise", () => {
    test("Returns a Promise which resolves to inner Err", async () => {
      const err = Err();
      const errPromise = err.$async().$promise();

      expect(errPromise).toBeInstanceOf(Promise);
      await expect(errPromise).resolves.toBe(err);
    });
  });

  //     describe("$andThrough", () => {
  //     describe("Ok", () => {});

  //     describe("Err", () => {});
  //   });

  //   describe("Ok", () => {});
  // describe("Err", () => {});

  //   describe("$flatten", () => {
  //     test("Returns the contained result", () => {
  //       const okInner = Ok("inner");
  //       const errInner = Err("inner");

  //       expect(Ok(okInner).$flatten()).toBe(okInner);
  //       expect(Ok(errInner).$flatten()).toBe(errInner);
  //     });
  //   });

  //   describe("$peek", () => {
  //     test("Returns itself after calling the provided function", () => {
  //       const ok = Ok("test");
  //       const peekFn = vi.fn(() => "peek");

  //       expect(ok.$peek(peekFn)).toBe(ok);
  //       expect(peekFn).toHaveBeenCalledExactlyOnceWith(ok);
  //     });

  //     testThrow(() => Ok("test").$peek(fn));
  //   });

  //   describe("$tap", () => {
  //     test("Returns itself after calling the provided function", () => {
  //       const ok = Ok("test");
  //       const fn = vi.fn(() => "tap");

  //       expect(ok.$tap(fn)).toBe(ok);
  //       expect(fn).toHaveBeenCalledExactlyOnceWith("test");
  //     });

  //     testThrow(() => Ok("test").$tap(fn));
  //   });

  //   describe("$tapErr", () => {
  //     test("Returns itself (noop for Ok)", () => {
  //       const ok = Ok("test");
  //       const fn = vi.fn(() => "tapErr");

  //       expect(ok.$tapErr(fn)).toBe(ok);
  //       expect(fn).not.toHaveBeenCalled();
  //     });
  //   });

  //   describe("$intoAsync", () => {
  //     test("Returns a ResultAsync which resolves to the Ok", async () => {
  //       const ok = Ok("test");
  //       const okAsync = ok.$intoAsync();

  //       expect(okAsync).toBeInstanceOf(ResultAsync);
  //       expect(await okAsync).toBe(ok);
  //     });
  //   });
});
