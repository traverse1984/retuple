import { vi, describe, it, expect } from "vitest";

import {
  errThrow,
  errReject,
  fnThrow,
  fnReject,
  mockReturnSequence,
  trackCallTimes,
} from "./util.js";

import { Result, Ok, Err } from "../src/index.js";

describe("ResultRetry", () => {
  it("invokes the retry function with no arguments when not awaited", () => {
    const fnRetry = vi.fn(() => Ok());

    Result.$retry(fnRetry);

    expect(fnRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it("invokes the retry function only once when it resolves to Err, and when no additional options are set", async () => {
    const fnRetry = vi.fn(() => Err());

    await Result.$retry(fnRetry);

    expect(fnRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it("rejects if the retry function throws", async () => {
    await expect(Result.$retry(fnThrow)).rejects.toBe(errThrow);
  });

  it("rejects if the retry function rejects", async () => {
    await expect(Result.$retry(fnReject)).rejects.toBe(errReject);
  });

  it("does not invoke the retry function again after a rejection", async () => {
    const fnRetry = vi.fn(fnReject);
    const retry = Result.$retry(fnRetry);

    await expect(retry).rejects.toBe(errReject);
    await expect(retry).rejects.toBe(errReject);

    expect(fnRetry).toHaveBeenCalledExactlyOnceWith();
  });

  it("resolves to Ok when the retry function resolves to Ok, and when no additional options are set", async () => {
    await expect(Result.$retry(() => Ok("test"))).resolves.toStrictEqual(
      Ok("test"),
    );

    await expect(Result.$retry(async () => Ok("test"))).resolves.toStrictEqual(
      Ok("test"),
    );
  });

  it("resolves to Err when the retry function resolves to Err, and when no additional options are set", async () => {
    await expect(Result.$retry(() => Err("test"))).resolves.toStrictEqual(
      Err("test"),
    );

    await expect(Result.$retry(async () => Err("test"))).resolves.toStrictEqual(
      Err("test"),
    );
  });

  describe("$times", () => {
    it("invokes the retry function just once when it resolves to Ok", async () => {
      const fnRetry = vi.fn(() => Ok());

      await Result.$retry(fnRetry).$times(3);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("invokes the retry function the number of times specified when it resolves to Err", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(3);

      expect(fnRetry).toHaveBeenCalledTimes(3);
    });

    it("invokes the retry function just once when the times value is not a number", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times("3" as any);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("invokes the retry function just once when the times value is NaN", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(NaN);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("invokes the retry function just once when the times value is not finite", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(Infinity);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("invokes the retry function just once when the times value is not an integer", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(3.1 as number);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("invokes the retry function just once when the times value is negative", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(-10 as number);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("invokes the retry function just once when the times value is zero", async () => {
      const fnRetry = vi.fn(() => Err());

      await Result.$retry(fnRetry).$times(-10 as number);

      expect(fnRetry).toHaveBeenCalledTimes(1);
    });

    it("invokes the retry function up the number of times specified, or until it resolves to Ok", async () => {
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

    it("rejects when the retry function throws beyond the first invocation", async () => {
      const fnRetry = mockReturnSequence(
        () => Err(),
        fnThrow,
        () => Ok(),
      );

      await expect(Result.$retry(fnRetry).$times(5)).rejects.toBe(errThrow);
    });

    it("rejects when the retry function rejects beyond the first invocation", async () => {
      const fnRetry = mockReturnSequence(
        () => Err(),
        fnReject,
        () => Ok(),
      );

      await expect(Result.$retry(fnRetry).$times(5)).rejects.toBe(errReject);
    });

    it("resolves to the most recent Err when no invocation resolves to Ok", async () => {
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

  describe("$monitor", () => {
    it("it invokes the monitor function with an object containing the most recent error value, attempt number and an abort function, when the retry function resolves to Err", async () => {
      let capturedMonitor: any;

      const fnMonitor = vi.fn((monitor) => (capturedMonitor = monitor));

      await expect(Result.$retry(() => Err("test")).$monitor(fnMonitor));

      expect(fnMonitor).toHaveBeenCalledOnce();
      expect(capturedMonitor.error).toStrictEqual("test");
      expect(capturedMonitor.attempt).toBe(1);
      expect(capturedMonitor.abort).toBeTypeOf("function");
    });

    it("rejects if the monitor function throws", async () => {
      await expect(Result.$retry(() => Err()).$monitor(fnThrow)).rejects.toBe(
        errThrow,
      );
    });

    it("rejects if the monitor function rejects", async () => {
      await expect(Result.$retry(() => Err()).$monitor(fnReject)).rejects.toBe(
        errReject,
      );
    });

    it("resolves to the most recent Err when the abort function is called", async () => {
      const fnRetry = mockReturnSequence(
        () => Err(1),
        () => Err(2),
        () => Err(3),
        () => Ok(4),
      );

      await expect(
        Result.$retry(fnRetry)
          .$times(4)
          .$monitor(({ attempt, abort }) => {
            if (attempt === 2) {
              abort();
            }
          }),
      ).resolves.toStrictEqual(Err(2));
    });
  });

  describe("$delay", () => {
    it("invokes the delay function with the attempt number for each attempt", async () => {
      const fnDelay = vi.fn(() => 0);

      await Result.$retry(() => Err())
        .$times(4)
        .$delay(fnDelay);

      expect(fnDelay).toHaveBeenNthCalledWith(1, 1);
      expect(fnDelay).toHaveBeenNthCalledWith(2, 2);
      expect(fnDelay).toHaveBeenNthCalledWith(3, 3);
      expect(fnDelay).not.toHaveBeenNthCalledWith(4, 4);
    });

    it("does not introduce a delay when the retry function resolves to Ok on the first invocation", async () => {
      const { fn, elapsed, times } = trackCallTimes(() => Ok());

      await Result.$retry(fn).$delay(10);

      expect(times[0]).toBe(undefined);
      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the times value is 1", async () => {
      const { fn, elapsed, times } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(1).$delay(10);

      expect(times[0]).toBe(undefined);
      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the retry is aborted", async () => {
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
        .$monitor(({ attempt, abort }) => {
          if (attempt === 2) {
            abort();
          }
        });

      expect(times[0]).toBeGreaterThanOrEqual(9);
      expect(times[1]).toBe(undefined);
      expect(elapsed()).toBeLessThan(15);
    });

    it("introduces a delay between invocations when the delay value is a positive integer", async () => {
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

    it("introduces a delay between invocations when the delay function returns a positive integer", async () => {
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

    it("does not introduce a delay when the delay value is not a number", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay("10" as any);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the delay value is NaN", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(4).$delay(NaN);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the delay value is not finite", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(4).$delay(Infinity);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the delay value is not an integer", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(10.5 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the delay value is negative", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(-10 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the delay value is zero", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn).$times(4).$delay(0);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the value returned by the delay function is not a number", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => "10" as any);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the value returned by the delay function is NaN", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => NaN);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the value returned by the delay function is not finite", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => Infinity);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the value returned by the delay function is not an integer", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => 10.5 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the value returned by the delay function is negative", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => -10 as number);

      expect(elapsed()).toBeLessThan(10);
    });

    it("does not introduce a delay when the value returned by the delay function is zero", async () => {
      const { fn, elapsed } = trackCallTimes(() => Err());

      await Result.$retry(fn)
        .$times(4)
        .$delay(() => 0);

      expect(elapsed()).toBeLessThan(10);
    });
  });

  describe("$async", () => {
    it("returns ResultAsync", () => {
      const prototype = Object.getPrototypeOf(Result.$safeAsync(() => {}));

      expect(Result.$retry(() => Ok("test")).$async()).toBeInstanceOf(
        prototype.constructor,
      );
    });

    it("resolves to the retry function Result", async () => {
      await expect(
        Result.$retry(() => Ok("test")).$async(),
      ).resolves.toStrictEqual(Ok("test"));
    });
  });
});
