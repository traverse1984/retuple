import { Ok, Err } from "../src/index.js";

export const ResultOk = Ok().constructor;
export const ResultErr = Err().constructor;
export const ResultAsync = Ok().$async().constructor;

export type ResultOk = typeof ResultOk;
export type ResultErr = typeof ResultErr;
export type ResultAsync = typeof ResultAsync;
