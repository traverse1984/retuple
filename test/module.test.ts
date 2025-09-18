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

    describe("RetupleCaughtValueError", () => {
      it("should be exported", () => {
        expect(rt.RetupleCaughtValueError).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleCaughtValueError.prototype).toBeInstanceOf(Error);
      });
    });

    describe("RetupleInvalidUnionError", () => {
      it("should be exported", () => {
        expect(rt.RetupleInvalidUnionError).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleInvalidUnionError.prototype).toBeInstanceOf(Error);
      });
    });

    describe("RetupleArrayMethodUnavailableError", () => {
      it("should be exported", () => {
        expect(rt.RetupleArrayMethodUnavailableError).toBeTypeOf("function");
      });

      it("should extend Error", () => {
        expect(rt.RetupleArrayMethodUnavailableError.prototype).toBeInstanceOf(
          Error,
        );
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

    it("should include the $from function", () => {
      expect(rt.Result.$from).toBeTypeOf("function");
    });

    it("should include the $resolve function", () => {
      expect(rt.Result.$resolve).toBeTypeOf("function");
    });

    it("should include the $nonNullable function", () => {
      expect(rt.Result.$nonNullable).toBeTypeOf("function");
    });

    it("should include the $truthy function", () => {
      expect(rt.Result.$truthy).toBeTypeOf("function");
    });

    it("should include the $fromUnion function", () => {
      expect(rt.Result.$fromUnion).toBeTypeOf("function");
    });

    it("should include the $safe function", () => {
      expect(rt.Result.$safe).toBeTypeOf("function");
    });

    it("should include the $safeAsync function", () => {
      expect(rt.Result.$safeAsync).toBeTypeOf("function");
    });

    it("should include the $safePromise function", () => {
      expect(rt.Result.$safePromise).toBeTypeOf("function");
    });

    it("should include the $retry function", () => {
      expect(rt.Result.$retry).toBeTypeOf("function");
    });

    it("should include the $safeRetry function", () => {
      expect(rt.Result.$safeRetry).toBeTypeOf("function");
    });
  });
});
