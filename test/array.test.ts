import { describe, it, expect } from "vitest";

import { capture, arrayMethodsUnavailable } from "./util.js";

import { Ok, Err, RetupleArrayMethodUnavailableError } from "../src/index.js";

describe("RetupleArray", () => {
  describe("Ok", () => {
    for (const method of arrayMethodsUnavailable) {
      it(`should throw RetupleArrayMethodUnavailableError when calling '${method}'`, () => {
        expect(capture(() => Ok()[method]())).toStrictEqual(
          new RetupleArrayMethodUnavailableError(Ok(), method),
        );
      });
    }
  });

  describe("Err", () => {
    for (const method of arrayMethodsUnavailable) {
      it(`should throw RetupleArrayMethodUnavailableError when calling '${method}'`, () => {
        expect(capture(() => Err()[method]())).toStrictEqual(
          new RetupleArrayMethodUnavailableError(Err(), method),
        );
      });
    }
  });
});
