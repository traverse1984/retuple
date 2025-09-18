/**
 * ## Result Like Symbol
 *
 * Implement a custom result-like by implementing the `ResultLike` interface
 * on a class or object. An object with this implementation can be converted
 * to a `Result` and can be used in most places where a `Result` is required.
 *
 * ```ts
 * import { ResultLikeSymbol } from "retuple/symbol";
 * import { Result, Ok, Err, type ResultLike } from "retuple";
 *
 * class CustomResult<T> implements ResultLike<T, CustomError> {
 *   value: T;
 *
 *   constructor(value: T) {
 *     this.value = value;
 *   }
 *
 *   [ResultLikeSymbol](): Result<T, CustomError> {
 *     return this.value === "test"
 *       ? Ok(this.value)
 *       : Err(new CustomError("Value was not test"));
 *   }
 * }
 *
 * const custom = new CustomResult("test");
 * const result: Result<string, Error> = Result(custom);
 *
 * const chain = Ok()
 *  .$map(() => "value")
 *  .$andThen((value) => new CustomResult(value))
 *  .$or(myresult);
 * ```
 */
export const ResultLikeSymbol = Symbol("retuple/result");
export type ResultLikeSymbol = typeof ResultLikeSymbol;
