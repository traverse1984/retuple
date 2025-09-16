import { describe, it, expect } from "vitest";

import * as rt from "../src/index.js";

describe("Module", () => {
  it("should not have a default export", () => {
    expect(rt).not.toHaveProperty("default");
  });

  it("should export the Ok function", () => {
    expect(rt.Ok).toBeTypeOf("function");
  });

  it("should export the Err function", () => {
    expect(rt.Err).toBeTypeOf("function");
  });

  it("should export the nonNullable function", () => {
    expect(rt.nonNullable).toBeTypeOf("function");
  });

  it("should export the truthy function", () => {
    expect(rt.truthy).toBeTypeOf("function");
  });

  it("should export the safe function", () => {
    expect(rt.safe).toBeTypeOf("function");
  });

  it("should export the safeAsync function", () => {
    expect(rt.safeAsync).toBeTypeOf("function");
  });

  it("should export the safePromise function", () => {
    expect(rt.safePromise).toBeTypeOf("function");
  });

  describe("Class exports", () => {
    describe("RetupleUnwrapFailed", () => {
      it("should be exported", () => {
        expect(rt.RetupleUnwrapFailed).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleUnwrapFailed.prototype).toBeInstanceOf(Error);
      });
    });

    describe("RetupleUnwrapFailed", () => {
      it("should be exported", () => {
        expect(rt.RetupleUnwrapErrFailed).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleUnwrapErrFailed.prototype).toBeInstanceOf(Error);
      });
    });

    describe("RetupleUnwrapFailed", () => {
      it("should be exported", () => {
        expect(rt.RetupleExpectFailed).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleExpectFailed.prototype).toBeInstanceOf(Error);
      });
    });

    describe("RetupleThrownValueError", () => {
      it("should be exported", () => {
        expect(rt.RetupleThrownValueError).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleThrownValueError.prototype).toBeInstanceOf(Error);
      });
    });

    describe("RetupleInvalidResultError", () => {
      it("should be exported", () => {
        expect(rt.RetupleInvalidResultError).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleInvalidResultError.prototype).toBeInstanceOf(Error);
      });
    });
  });

  describe("Result export", () => {
    it("should be a function", () => {
      expect(rt.Result).toBeTypeOf("function");
    });

    it("should be frozen", () => {
      expect(Object.isFrozen(rt.Result)).toBe(true);
    });

    it("should include the function exports from the module", () => {
      expect(rt.Result).toStrictEqual(
        expect.objectContaining({
          Ok: rt.Ok,
          Err: rt.Err,
          $nonNullable: rt.nonNullable,
          $truthy: rt.truthy,
          $safe: rt.safe,
          $safeAsync: rt.safeAsync,
          $safePromise: rt.safePromise,
        }),
      );
    });
  });
});
