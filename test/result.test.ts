import { vi, describe, test, expect } from "vitest";
import { capture, errThrow, errReject, fnThrow, fnReject } from "./util.js";

import { Result, RetupleThrownValueError } from "../src/index.js";

describe("Result", () => {
  describe("from", () => {
    test("Returns Ok if the value is truthy", () => {
      expect(Result.from(true).$isOk()).toBe(true);
      expect(Result.from(1).$isOk()).toBe(true);
      expect(Result.from(1n).$isOk()).toBe(true);
      expect(Result.from("test").$isOk()).toBe(true);
      expect(Result.from({}).$isOk()).toBe(true);
      expect(Result.from([]).$isOk()).toBe(true);
      expect(Result.from(new Date("Invalid")).$isOk()).toBe(true);
    });

    test("Returns Err if the value is truthy", () => {
      expect(Result.from(undefined).$isErr()).toBe(true);
      expect(Result.from(null).$isErr()).toBe(true);
      expect(Result.from(false).$isErr()).toBe(true);
      expect(Result.from(0).$isErr()).toBe(true);
      expect(Result.from(0n).$isErr()).toBe(true);
      expect(Result.from(NaN).$isErr()).toBe(true);
      expect(Result.from("").$isErr()).toBe(true);
    });

    test("Uses the error from the error function", () => {
      expect(Result.from(undefined, () => "test").$value()).toBe("test");
    });

    test("Throws the error if the error function throws", () => {
      expect(capture(() => Result.from(undefined, fnThrow))).toBe(errThrow);
    });
  });

  describe("safe", () => {
    test("Returns Ok if the function does not throw", () => {
      const fn = vi.fn(() => "test");

      expect(Result.safe(fn).$value()).toBe("test");
      expect(fn).toHaveBeenCalledExactlyOnceWith();
    });

    test("Returns Err if the function throws", () => {
      const error = new Error("test");
      const fn = vi.fn(() => {
        throw error;
      });

      expect(Result.safe(fn).$value()).toBe(error);
      expect(fn).toHaveBeenCalledExactlyOnceWith();
    });

    test("Replaces the error using the mapError function", () => {
      const fnMapError = vi.fn(() => "test");

      expect(Result.safe(fnThrow, fnMapError).$value()).toBe("test");
      expect(fnMapError).toHaveBeenCalledExactlyOnceWith(errThrow);
    });

    test("Replaces the error with RetupleThrownValueError if it is not an instance of Error, and if no mapError function is provided", () => {
      const fn = () => {
        throw "test";
      };

      expect(Result.safe(fn).$value()).toBeInstanceOf(RetupleThrownValueError);
      expect(Result.safe(fn).$value()).toStrictEqual(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Throws the error when the mapError function throws", () => {
      expect(capture(() => Result.safe(fnThrow, fnThrow))).toBe(errThrow);
    });
  });

  describe("safeAsync", () => {
    test("Resolves to Ok if the function does not throw/reject", async () => {
      const fnSync = vi.fn(() => "test");
      const fnAsync = vi.fn(async () => "test");

      await expect(Result.safeAsync(fnSync).$value()).resolves.toBe("test");
      expect(fnSync).toHaveBeenCalledExactlyOnceWith();

      await expect(Result.safeAsync(fnAsync).$value()).resolves.toBe("test");
      expect(fnSync).toHaveBeenCalledExactlyOnceWith();
    });

    test("Resolves to Err if the function throws/rejects", async () => {
      const fnSync = vi.fn(fnThrow);
      const fnAsync = vi.fn(fnReject);

      await expect(Result.safeAsync(fnSync).$value()).resolves.toBe(errThrow);
      expect(fnSync).toHaveBeenCalledExactlyOnceWith();

      await expect(Result.safeAsync(fnAsync).$value()).resolves.toBe(errReject);
      expect(fnAsync).toHaveBeenCalledExactlyOnceWith();
    });

    test("Replaces the error using the mapError function", async () => {
      const fn = vi.fn(() => "test");

      await expect(Result.safeAsync(fnThrow, fn).$value()).resolves.toBe(
        "test",
      );
      expect(fn).toHaveBeenLastCalledWith(errThrow);

      await expect(Result.safeAsync(fnReject, fn).$value()).resolves.toBe(
        "test",
      );
      expect(fn).toHaveBeenLastCalledWith(errReject);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test("Replaces the error with RetupleThrownValueError if it is not an instance of Error, and if no mapError function is provided", async () => {
      const fnThrowNonError = () => {
        throw "test";
      };

      await expect(
        Result.safeAsync(fnThrowNonError).$value(),
      ).resolves.toBeInstanceOf(RetupleThrownValueError);
      await expect(
        Result.safeAsync(fnThrowNonError).$value(),
      ).resolves.toStrictEqual(expect.objectContaining({ value: "test" }));
    });

    test("Rejects with the error when the mapError function throws", async () => {
      await expect(Result.safeAsync(fnReject, fnThrow)).rejects.toBe(errThrow);
    });
  });

  describe("safePromise", () => {
    test("Resolves to Ok if the promise resolves", async () => {
      await expect(
        Result.safePromise(Promise.resolve("test")).$value(),
      ).resolves.toBe("test");
    });

    test("Resolves to Err if the promise rejects", async () => {
      await expect(Result.safePromise(fnReject()).$value()).resolves.toBe(
        errReject,
      );
    });

    test("Replaces the error using the mapError function", async () => {
      const fn = vi.fn(() => "test");

      await expect(Result.safePromise(fnReject(), fn).$value()).resolves.toBe(
        "test",
      );
      expect(fn).toHaveBeenCalledExactlyOnceWith(errReject);
    });

    test("Replaces the error with RetupleThrownValueError if it is not an instance of Error, and if no mapError function is provided", async () => {
      const promise = Promise.reject("test");

      await expect(
        Result.safePromise(promise).$value(),
      ).resolves.toBeInstanceOf(RetupleThrownValueError);
      await expect(Result.safePromise(promise).$value()).resolves.toStrictEqual(
        expect.objectContaining({ value: "test" }),
      );
    });

    test("Rejects with the error when the mapError function throws", async () => {
      await expect(Result.safePromise(Promise.reject(), fnThrow)).rejects.toBe(
        errThrow,
      );
    });
  });
});
