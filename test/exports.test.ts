import { describe, test, expect } from "vitest";

import * as rt from "../src/index.js";
import rtdefault from "../src/index.js";

describe("Exports", () => {
  test("Exports Result object", () => {
    expect(rt.Result).toBeTypeOf("object");
    expect(rt.Result).not.toBe(null);
  });

  test("Exports Ok function", () => {
    expect(rt.Ok).toBeTypeOf("function");
  });

  test("Exports Err function", () => {
    expect(rt.Err).toBeTypeOf("function");
  });

  test("Exports from function", () => {
    expect(rt.from).toBeTypeOf("function");
  });

  test("Exports safe function", () => {
    expect(rt.safe).toBeTypeOf("function");
  });

  test("Exports safeAsync function", () => {
    expect(rt.safeAsync).toBeTypeOf("function");
  });

  test("Exports safePromise function", () => {
    expect(rt.safePromise).toBeTypeOf("function");
  });

  test("The default export is the Result object", () => {
    expect(rtdefault).toBe(rt.Result);
  });

  test("The Result object is frozen", () => {
    expect(Object.isFrozen(rt.Result)).toBe(true);
  });

  test("The Result object includes the function exports", () => {
    expect(rt.Result.Ok).toBe(rt.Ok);
    expect(rt.Result.Err).toBe(rt.Err);
    expect(rt.Result.from).toBe(rt.from);
    expect(rt.Result.safe).toBe(rt.safe);
    expect(rt.Result.safeAsync).toBe(rt.safeAsync);
    expect(rt.Result.safePromise).toBe(rt.safePromise);
  });

  test("Exports RetupleUnwrapFailed class", () => {
    expect(rt.RetupleUnwrapFailed).toBeTypeOf("function");
    expect(rt.RetupleUnwrapFailed.prototype).toBeInstanceOf(Error);
    expect(Object.isFrozen(rt.RetupleUnwrapFailed)).toBe(true);
    expect(Object.isFrozen(rt.RetupleUnwrapFailed.prototype)).toBe(true);
  });

  test("Exports RetupleUnwrapFailed class", () => {
    expect(rt.RetupleUnwrapErrFailed).toBeTypeOf("function");
    expect(rt.RetupleUnwrapErrFailed.prototype).toBeInstanceOf(Error);
    expect(Object.isFrozen(rt.RetupleUnwrapErrFailed)).toBe(true);
    expect(Object.isFrozen(rt.RetupleUnwrapErrFailed.prototype)).toBe(true);
  });

  test("Exports RetupleUnwrapFailed class", () => {
    expect(rt.RetupleExpectFailed).toBeTypeOf("function");
    expect(rt.RetupleExpectFailed.prototype).toBeInstanceOf(Error);
    expect(Object.isFrozen(rt.RetupleExpectFailed)).toBe(true);
    expect(Object.isFrozen(rt.RetupleExpectFailed.prototype)).toBe(true);
  });

  test("Exports RetupleThrownValueError class", () => {
    expect(rt.RetupleThrownValueError).toBeTypeOf("function");
    expect(rt.RetupleThrownValueError.prototype).toBeInstanceOf(Error);
    expect(Object.isFrozen(rt.RetupleThrownValueError)).toBe(true);
    expect(Object.isFrozen(rt.RetupleThrownValueError.prototype)).toBe(true);
  });
});
