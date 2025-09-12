import { vi, describe, test, expect } from "vitest";
import { errThrow, errReject, fnThrow, fnReject } from "./util.js";

import {
  Ok,
  Err,
  RetupleUnwrapErrFailed,
  RetupleThrownValueError,
} from "../src/index.js";

describe("ResultAsync (Ok)", async () => {
  describe("$expect", () => {
    test("Resolves to the contained value", async () => {
      await expect(Ok("test").$async().$expect()).resolves.toBe("test");
    });
  });

  describe("$unwrap", () => {
    test("Resolves to the contained value", async () => {
      await expect(Ok("test").$async().$unwrap()).resolves.toBe("test");
    });
  });

  describe("$unwrapErr", () => {
    test("Rejects with RetupleUnwrapErrFailed", async () => {
      await expect(Ok().$async().$unwrapErr()).rejects.toThrow(
        RetupleUnwrapErrFailed,
      );
      await expect(Ok("test").$async().$unwrapErr()).rejects.toThrow(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Uses the custom message if provided", async () => {
      await expect(() =>
        Ok().$async().$unwrapErr("Test error message"),
      ).rejects.toThrow("Test error message");
    });
  });

  describe("$unwrapOr", () => {
    test("Resolves to the contained value", async () => {
      await expect(Ok("test").$async().$unwrapOr("default")).resolves.toBe(
        "test",
      );
    });
  });

  describe("$unwrapOrElse", () => {
    test("Resolves to the contained value", async () => {
      const fn = vi.fn(() => "default");

      await expect(Ok("test").$async().$unwrapOrElse(fn)).resolves.toBe("test");
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$map", () => {
    test("Resolves to Ok containing the mapped value", async () => {
      const fn = vi.fn(() => "mapped");

      await expect(Ok("test").$async().$map(fn).$unwrap()).resolves.toBe(
        "mapped",
      );
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Ok().$async().$map(fnThrow)).rejects.toBe(errThrow);
    });
  });

  describe("$mapErr", () => {
    test("Resolves to itself", async () => {
      const ok = Ok("test");
      const fn = vi.fn(() => "mapped");

      await expect(ok.$async().$mapErr(fn)).resolves.toBe(ok);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$mapOr", () => {
    test("Resolves to Ok containing the mapped value", async () => {
      const fn = vi.fn(() => "mapped");

      await expect(
        Ok("test").$async().$mapOr("default", fn).$unwrap(),
      ).resolves.toBe("mapped");
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Ok().$async().$map(fnThrow)).rejects.toBe(errThrow);
    });
  });

  describe("$mapOrElse", () => {
    test("Resolves to Ok containing the mapped value", async () => {
      const fnDefault = vi.fn(() => "default");
      const fnMap = vi.fn(() => "mapped");

      await expect(
        Ok("test").$async().$mapOrElse(fnDefault, fnMap).$unwrap(),
      ).resolves.toBe("mapped");
      expect(fnDefault).not.toHaveBeenCalled();
      expect(fnMap).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the map function throws", async () => {
      await expect(
        Ok()
          .$async()
          .$mapOrElse(() => {}, fnThrow),
      ).rejects.toBe(errThrow);
    });
  });

  describe("$or", () => {
    test("Resolves to itself", async () => {
      const ok = Ok();

      await expect(ok.$async().$or(Ok())).resolves.toBe(ok);
      await expect(ok.$async().$or(Ok().$async())).resolves.toBe(ok);
      await expect(ok.$async().$or(Promise.resolve(Ok()))).resolves.toBe(ok);
    });

    test("Does not reject if the promise rejects", async () => {
      const ok = Ok();
      const rejected = fnReject();

      await expect(ok.$async().$or(rejected)).resolves.toBe(ok);
      await rejected.catch(() => {});
    });
  });

  describe("$orElse", () => {
    test("Resolves to itself", async () => {
      const ok = Ok();
      const fn = vi.fn(() => Ok());

      await expect(ok.$async().$orElse(fn)).resolves.toBe(ok);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$orSafe", () => {
    test("Resolves to itself", async () => {
      const ok = Ok();
      const fn = vi.fn(() => {});
      const fnMapError = vi.fn(() => {});

      await expect(ok.$async().$orSafe(fn, fnMapError)).resolves.toBe(ok);
      expect(fn).not.toHaveBeenCalled();
      expect(fnMapError).not.toHaveBeenCalled();
    });
  });

  describe("$and", () => {
    test("Resolves to the Result", async () => {
      const result = Ok();

      await expect(Ok().$async().$and(result)).resolves.toBe(result);
      await expect(Ok().$async().$and(result.$async())).resolves.toBe(result);
      await expect(Ok().$async().$and(Promise.resolve(result))).resolves.toBe(
        result,
      );
    });

    test("Rejects with the error if the promise rejects", async () => {
      await expect(Ok().$async().$and(fnReject())).rejects.toBe(errReject);
    });
  });

  describe("$andThen", () => {
    test("Resolves to the Result obtained by calling the function", async () => {
      const result = Ok();
      const fnSync = vi.fn(() => result);
      const fnAsync = vi.fn(async () => result);

      await expect(Ok("test").$async().$andThen(fnSync)).resolves.toBe(result);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(Ok("test").$async().$andThen(fnAsync)).resolves.toBe(result);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Ok().$async().$andThen(fnThrow)).rejects.toBe(errThrow);
    });

    test("Rejects with the error when the function returns a rejecting promise", async () => {
      await expect(Ok().$async().$andThen(fnReject)).rejects.toBe(errReject);
    });
  });

  describe("$andThrough", () => {
    test("Resolves to itself if the function resolves to Ok", async () => {
      const ok = Ok("test");
      const fnSync = vi.fn(() => Ok());
      const fnAsync = vi.fn(async () => Ok());

      await expect(ok.$async().$andThrough(fnSync)).resolves.toBe(ok);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(ok.$async().$andThrough(fnAsync)).resolves.toBe(ok);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Resolves to the Err if the provided function resolves to Err", async () => {
      const err = Err();
      const fnSync = vi.fn(() => err);
      const fnAsync = vi.fn(async () => err);

      await expect(Ok("test").$async().$andThrough(fnSync)).resolves.toBe(err);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(Ok("test").$async().$andThrough(fnAsync)).resolves.toBe(err);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Ok().$async().$andThrough(fnThrow)).rejects.toBe(errThrow);
    });

    test("Rejects with the error when the function returns a rejecting promise", async () => {
      await expect(Ok().$async().$andThrough(fnReject)).rejects.toBe(errReject);
    });
  });

  describe("$andSafe", () => {
    test("Resolves to Ok if the function does not throw/reject", async () => {
      const fnSync = vi.fn(() => "value");
      const fnAsync = vi.fn(async () => "value");

      await expect(
        Ok("test").$async().$andSafe(fnSync).$unwrap(),
      ).resolves.toBe("value");
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(
        Ok("test").$async().$andSafe(fnAsync).$unwrap(),
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
        Ok("test").$async().$andSafe(fnSync).$unwrapErr(),
      ).resolves.toBe(errThrow);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith("test");

      await expect(
        Ok("test").$async().$andSafe(fnAsync).$unwrapErr(),
      ).resolves.toBe(errReject);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Replaces the error using the mapError function", async () => {
      const fn = vi.fn(() => "test");

      await expect(
        Ok().$async().$andSafe(fnThrow, fn).$unwrapErr(),
      ).resolves.toBe("test");
      expect(fn).toHaveBeenLastCalledWith(errThrow);

      await expect(
        Ok().$async().$andSafe(fnReject, fn).$unwrapErr(),
      ).resolves.toBe("test");
      expect(fn).toHaveBeenLastCalledWith(errReject);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("Replaces the error with RetupleThrownValueError if it is not an instance of Error, and if no mapError function is provided", async () => {
      const fnThrowNonError = () => {
        throw "test";
      };

      await expect(
        Ok().$async().$andSafe(fnThrowNonError).$unwrapErr(),
      ).resolves.toBeInstanceOf(RetupleThrownValueError);
      await expect(
        Ok().$async().$andSafe(fnThrowNonError).$unwrapErr(),
      ).resolves.toStrictEqual(expect.objectContaining({ value: "test" }));
    });

    test("Rejects with the error when the mapError function throws", async () => {
      await expect(Ok().$async().$andSafe(fnReject, fnThrow)).rejects.toBe(
        errThrow,
      );
    });
  });

  describe("$peek", () => {
    test("Resolves to itself after calling the function with the Ok", async () => {
      const ok = Ok();
      const fnSync = vi.fn(() => {});
      const fnAsync = vi.fn(async () => {});

      await expect(ok.$async().$peek(fnSync)).resolves.toBe(ok);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith(ok);

      await expect(ok.$async().$peek(fnAsync)).resolves.toBe(ok);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith(ok);
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Ok().$async().$peek(fnThrow)).rejects.toBe(errThrow);
    });

    test("Rejects with the error when the function returns a rejecting promise", async () => {
      await expect(Ok().$async().$peek(fnReject)).rejects.toBe(errReject);
    });
  });

  describe("$tap", () => {
    test("Resolves to itself after calling the function with the contained value", async () => {
      const ok = Ok("test");
      const fn = vi.fn(() => {});

      await expect(ok.$async().$tap(fn)).resolves.toBe(ok);
      expect(fn).toHaveBeenCalledExactlyOnceWith("test");
    });

    test("Rejects with the error when the function throws", async () => {
      await expect(Ok().$async().$tap(fnThrow)).rejects.toBe(errThrow);
    });

    test("Rejects with the error when the function returns a rejecting promise", async () => {
      await expect(Ok().$async().$tap(fnReject)).rejects.toBe(errReject);
    });
  });

  describe("$tapErr", () => {
    test("Resolves to itself", async () => {
      const ok = Ok("test");
      const fn = vi.fn(() => {});

      await expect(ok.$async().$tapErr(fn)).resolves.toBe(ok);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("$promise", () => {
    test("Returns a Promise which resolves to inner instance", async () => {
      const ok = Ok();
      const okPromise = ok.$async().$promise();

      expect(okPromise).toBeInstanceOf(Promise);
      await expect(okPromise).resolves.toBe(ok);
    });
  });
});
