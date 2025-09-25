import { vi, describe, it, expect } from "vitest";

import {
  errThrow,
  errReject,
  fnThrow,
  fnReject,
  mockReturnSequence,
  trackCallTimes,
} from "./util.js";

import { Result, Ok, Err, type ResultRetryController } from "../src/index.js";

describe("ResultRetry", () => {
  it("should invoke the retry function with no arguments when not awaited", () => {
    const fnRetry = vi.fn(() => Ok());

    Result.$retry(fnRetry);

    expect(fnRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it("should invoke the retry function only once when it resolves to Err, and when no additional options are set", async () => {
    const fnRetry = vi.fn(() => Err());

    await Result.$retry(fnRetry);

    expect(fnRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it("should reject if the retry function throws", async () => {
    await expect(Result.$retry(fnThrow)).rejects.toBe(errThrow);
  });

  it("should reject if the retry function rejects", async () => {
    await expect(Result.$retry(fnReject)).rejects.toBe(errReject);
  });

  it("should not invoke the retry function again after a rejection", async () => {
    const fnRetry = vi.fn(fnReject);
    const retry = Result.$retry(fnRetry);

    await expect(retry).rejects.toBe(errReject);
    await expect(retry).rejects.toBe(errReject);

    expect(fnRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it("should resolve to Ok when the retry function resolves to Ok, and when no additional options are set", async () => {
    await expect(Result.$retry(() => Ok("test"))).resolves.toStrictEqual(
      Ok("test"),
    );

    await expect(Result.$retry(async () => Ok("test"))).resolves.toStrictEqual(
      Ok("test"),
    );
  });

  it("should resolve to Err when the retry function resolves to Err, and when no additional options are set", async () => {
    await expect(Result.$retry(() => Err("test"))).resolves.toStrictEqual(
      Err("test"),
    );

    await expect(Result.$retry(async () => Err("test"))).resolves.toStrictEqual(
      Err("test"),
    );
  });

  describe("$times", () => {
    it("should invoke the retry function just once when it resolves to Ok", async () => {
      const fnRetry = vi.fn(() => Ok());

      await Result.$retry(fnRetry).$times(3);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("should invoke the retry function the number of times specified when it resolves to Err", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(3);

      expect(fnRetry).toHaveBeenCalledTimes(3);
    });

    it("should invoke the retry function just once when the times value is not a number", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times("3" as any);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("should invoke the retry function just once when the times value is NaN", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(NaN);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("should invoke the retry function just once when the times value is not finite", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(Infinity);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("should invoke the retry function just once when the times value is not an integer", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(3.1 as number);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("should invoke the retry function just once when the times value is negative", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(-10 as number);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("should invoke the retry function just once when the times value is zero", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(-10 as number);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("should invoke the retry function up the number of times specified, or until it resolves to Ok", async () => {
      const fnRetry = vi.fn(
        mockReturnSequence(
          () => Err(),
          () => Err(),
          () => Ok(),
          () => Err(),
          () => Err(),
        ),
      );

      await Result.$retry(fnRetry).$times(5);

      expect(fnRetry).toHaveBeenCalledTimes(3);
    });

    it("should reject when the retry function throws beyond the first invocation", async () => {
      const fnRetry = mockReturnSequence(
        () => Err(),
        fnThrow,
        () => Ok(),
      );

      await expect(Result.$retry(fnRetry).$times(5)).rejects.toBe(errThrow);
    });

    it("should reject when the retry function rejects beyond the first invocation", async () => {
      const fnRetry = mockReturnSequence(
        () => Err(),
        fnReject,
        () => Ok(),
      );

      await expect(Result.$retry(fnRetry).$times(5)).rejects.toBe(errReject);
    });

    it("should resolve to the most recent Err when no invocation resolves to Ok", async () => {
      const fnRetry = mockReturnSequence(
        () => Err(1),
        () => Err(2),
        () => Err(3),
      );

      await expect(Result.$retry(fnRetry).$times(3)).resolves.toStrictEqual(
        Err(3),
      );
    });
  });

  describe("$handle", () => {
    it("should invoke the monitor function with an object containing the most recent error value, attempt number and an abort function, when the retry function resolves to Err", async () => {
      const monitors: ResultRetryController<string>[] = [];
      const fnMonitor = vi.fn((monitor) => monitors.push(monitor));

      await Result.$retry(() => Err(`test:${monitors.length + 1}`))
        .$times(2)
        .$handle(fnMonitor);

      expect(fnMonitor).toHaveBeenCalledTimes(2);

      expect(monitors[0]!.error).toStrictEqual("test:1");
      expect(monitors[0]!.attempt).toBe(1);
      expect(monitors[0]!.abort).toBeTypeOf("function");

      expect(monitors[1]!.error).toStrictEqual("test:2");
      expect(monitors[1]!.attempt).toBe(2);
      expect(monitors[1]!.abort).toBeTypeOf("function");
    });

    it("should reject if the monitor function throws", async () => {
      await expect(Result.$retry(() => Err()).$handle(fnThrow)).rejects.toBe(
        errThrow,
      );
    });

    it("should reject if the monitor function rejects", async () => {
      await expect(Result.$retry(() => Err()).$handle(fnReject)).rejects.toBe(
        errReject,
      );
    });

    it("should resolve to the most recent Err when the abort function is called", async () => {
      const fnRetry = mockReturnSequence(
        () => Err(1),
        () => Err(2),
        () => Err(3),
        () => Ok(4),
      );

      await expect(
        Result.$retry(fnRetry)
          .$times(4)
          .$handle(({ attempt, abort }) => {
            if (attempt === 2) {
              abort();
            }
          }),
      ).resolves.toStrictEqual(Err(2));
    });
  });

  describe("$delay", () => {
    it("should invoke the delay function with the attempt number for each attempt made", async () => {
      const fnDelay = vi.fn(() => 0);

      await Result.$retry(() => Err())
        .$times(4)
        .$delay(fnDelay);

      expect(fnDelay).toHaveBeenNthCalledWith(1, 1);
      expect(fnDelay).toHaveBeenNthCalledWith(2, 2);
      expect(fnDelay).toHaveBeenNthCalledWith(3, 3);
      expect(fnDelay).not.toHaveBeenNthCalledWith(4, 4);
    });

    it("should not introduce a delay when the retry function resolves to Ok on the first invocation", async () => {
      const { fn, elapsed, times } = trackCallTimes(() => Ok());

      await Result.$retry(fn).$delay(10);

      expect(times[0]).toBe(undefined);
      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the times value is 1", async () => {
      const { fn, elapsed, times } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(1).$delay(10);

      expect(times[0]).toBe(undefined);
      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the retry is aborted", async () => {
      const { fn, elapsed, times } = trackCallTimes(
        mockReturnSequence(
          () => Err(1),
          () => Err(2),
          () => Err(3),
        ),
      );

      await Result.$retry(fn)
        .$times(3)
        .$delay(10)
        .$handle(({ attempt, abort }) => {
          if (attempt === 2) {
            abort();
          }
        });

      expect(times[0]).toBeGreaterThanOrEqual(9);
      expect(times[1]).toBe(undefined);
      expect(elapsed()).toBeLessThan(15);
    });

    it("should not introduce a delay when the delay value is not a number", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay("10" as any);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the delay value is NaN", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(4).$delay(NaN);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the delay value is not finite", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(4).$delay(Infinity);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the delay value is not an integer", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(10.5 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the delay value is negative", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(-10 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the delay value is zero", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(4).$delay(0);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the value returned by the delay function is not a number", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => "10" as any);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the value returned by the delay function is NaN", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => NaN);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the value returned by the delay function is not finite", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => Infinity);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the value returned by the delay function is not an integer", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => 10.5 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the value returned by the delay function is negative", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => -10 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should not introduce a delay when the value returned by the delay function is zero", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => 0);

      expect(elapsed()).toBeLessThan(10);
    });

    it("should introduce a delay between invocations when the delay value is a positive integer", async () => {
      const { fn, elapsed, times } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(4).$delay(10);

      expect(times[0]).toBeGreaterThanOrEqual(9);
      expect(times[1]).toBeGreaterThanOrEqual(9);
      expect(times[2]).toBeGreaterThanOrEqual(9);
      expect(times[3]).toBe(undefined);

      const end = elapsed();

      expect(end).toBeGreaterThanOrEqual(27);
      expect(end).toBeLessThan(36);
    });

    it("should introduce a delay between invocations when the delay function returns a positive integer", async () => {
      const { fn, elapsed, times } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay((attempt) => attempt * 10);

      expect(times[0]).toBeGreaterThanOrEqual(9);
      expect(times[1]).toBeGreaterThanOrEqual(18);
      expect(times[2]).toBeGreaterThanOrEqual(27);

      const end = elapsed();

      expect(end).toBeGreaterThanOrEqual(54);
      expect(end).toBeLessThan(72);
    });
  });

  describe("$async", () => {
    it("should extend ResultAsync", () => {
      const prototype = Object.getPrototypeOf(Result.$safeAsync(() => {}));

      expect(Result.$retry(() => Ok("test"))).toBeInstanceOf(
        prototype.constructor,
      );
    });

    it("should resolve to the retry function Result", async () => {
      await expect(Result.$retry(() => Ok("test"))).resolves.toStrictEqual(
        Ok("test"),
      );
    });
  });

  describe("$promise", () => {
    it("should return a Promise", () => {
      expect(Result.$retry(() => Ok("test")).$promise()).toBeInstanceOf(
        Promise,
      );
    });

    it("should resolve to the retry function Result", async () => {
      await expect(
        Result.$retry(() => Ok("test")).$promise(),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });
});
