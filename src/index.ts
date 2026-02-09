import {
  ResultLikeSymbol,
  type ResultLike,
  type ResultLikeOk,
  type ResultLikeErr,
} from "retuple-symbols";

const RetupleStackSymbol = Symbol("RetupleStackSymbol");

export type Ok = typeof Ok;
export type Err = typeof Err;
export type Result<T, E> = (OkTuple<T> | ErrTuple<E>) & Retuple<T, E>;

export { type ResultAsync, type ResultRetry };

export interface ResultRetryController<E> {
  error: E;
  attempt: number;
  abort: () => void;
}

/**
 * ## Retuple Unwrap Failed
 *
 * An error which occurs when calling `$unwrap` on `Err`.
 */
export class RetupleUnwrapFailed<const E = unknown> extends Error {
  constructor(
    public value: E,
    msg = "Unwrap failed",
  ) {
    super(msg, value instanceof Error ? { cause: value } : undefined);
  }
}

/**
 * ## Retuple Unwrap Err Failed
 *
 * An error which occurs when calling `$unwrapErr` on `Ok`.
 */
export class RetupleUnwrapErrFailed<const T = unknown> extends Error {
  constructor(
    public value: T,
    msg = "Unwrap error failed",
  ) {
    super(msg);
  }
}

/**
 * ## Retuple Expect Failed
 *
 * An error which occurs when calling `$expect` on `Err`, when the value
 * contained in the `Err` is not an instance of `Error`.
 */
export class RetupleExpectFailed<const E = unknown> extends Error {
  constructor(public value: E) {
    super("Expect failed");
  }
}

/**
 * ## Retuple Assert Failed
 *
 * This error is used as the error type of a `Result` when using $assert,
 * when no map error function is provided.
 */
export class RetupleAssertFailed<const T = unknown> extends Error {
  constructor(public value: T) {
    super("Assert failed");
  }
}

/**
 * ## Retuple Filter Failed
 *
 * This error is used as the error type of a `Result` when using $filter,
 * when no map error function is provided.
 */
export class RetupleFilterFailed<const T = unknown> extends Error {
  constructor(public value: T) {
    super("Filter failed");
  }
}

/**
 * ## Retuple Index Failed
 *
 * This error is used as the error type of a `Result` when using $atIndex or
 * $firstIndex, when no map error function is provided.
 */
export class RetupleIndexFailed<const T = unknown> extends Error {
  constructor(
    public index: number,
    public value: T,
  ) {
    super("Index failed");
  }
}

/**
 * ## Retuple Thrown Value Error
 *
 * An error constructed when a safe function call throws or rejects, when the
 * thrown error or rejected value is not an instance of `Error`, and when no
 * map error function is provided.
 */
export class RetupleCaughtValueError extends Error {
  constructor(public value: unknown) {
    super("Caught value was not an instance of Error");
  }
}

/**
 * ## Retuple Invalid Union Error
 *
 * This error is thrown when attempting to construct a `Result` from a
 * discriminated union, when the 'success' property is not boolean. In this
 * case, it is impossible to determine whether the result should be `Ok` or
 * `Err`.
 */
export class RetupleInvalidUnionError extends Error {
  constructor(public value: unknown) {
    super(
      "Constructing a Result from discriminated union failed, the success " +
        "property must be boolean",
    );
  }
}

/**
 * ## Result
 *
 * @TODO
 */
export function Result<T, E>(resultLike: ResultLike<T, E>): Result<T, E> {
  return asResult(resultLike);
}

Result.Ok = Ok;
Result.Err = Err;
Result.$from = $from;
Result.$resolve = $resolve;
Result.$nonNullable = $nonNullable;
Result.$truthy = $truthy;
Result.$fromUnion = $fromUnion;
Result.$safe = $safe;
Result.$safeAsync = $safeAsync;
Result.$safePromise = $safePromise;
Result.$retry = $retry;
Result.$safeRetry = $safeRetry;
Result.$all = $all;
Result.$allPromised = $allPromised;
Result.$any = $any;
Result.$anyPromised = $anyPromised;
Result.$collect = $collect;
Result.$collectPromised = $collectPromised;
Result.$pipe = $pipe;
Result.$pipeAsync = $pipeAsync;

Object.freeze(Result);

/**
 * Create a new {@link Result} with the `Ok` variant. When called without
 * arguments the `T` type is `void`.
 *
 * @example
 *
 * ```ts
 * const [err, value] = Ok("test");
 *
 * assert.equal(err, undefined);
 * assert.equal(value, "test");
 * ```
 *
 * @example
 *
 * ```ts
 * const result: Result<void, never> = Ok();
 * ```
 */
export function Ok(): Result<void, never>;
export function Ok<const T>(val: T): Result<T, never>;
export function Ok<const T>(val?: T): ThisOk<T | void> {
  return new ResultOk<T | void, never>(val) as any;
}

/**
 * Create a new {@link Result} with the `Err` variant. When called without
 * arguments the `E` type is `void`.
 *
 * @example
 *
 * ```ts
 * const [err, value] = Err("test");
 *
 * assert.equal(err, "test");
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const result: Result<never, void> = Err();
 * ```
 */
export function Err(): Result<never, void>;
export function Err<const E>(err: E): Result<never, E>;
export function Err<const E>(err?: E): ThisErr<E | void> {
  return new ResultErr<never, E | void>(err) as any;
}

/**
 * Construct a {@link Result} from a {@link ResultLike}.
 *
 * @example
 *
 * ```ts
 * const value: Result<T, E> | ResultLike<T, E> = someResultFn();
 * const result: Result<T, E> = Result.$from(result);
 * ```
 */
function $from<T, E>(result: ResultLike<T, E>): Result<T, E> {
  if (result instanceof ResultOk || result instanceof ResultErr) {
    return result;
  }

  return asResult(result);
}

/**
 * Construct a {@link ResultAsync} from a {@link ResultLikeAwaitable}.
 *
 * @example
 *
 * ```ts
 * const value:
 *    | Result<T, E>
 *    | ResultLike<T, E>
 *    | ResultAsync<T, E>
 *    | Promise<Result<T, E>>
 *    | Promise<ResultLike<T, E>>
 *    | PromiseLike<Result<T, E>>
 *    | PromiseLike<ResultLike<T, E>> = someResultFn();
 *
 * const result: ResultAsync<T, E> = Result.$resolve(result);
 * ```
 */
function $resolve<T, E>(result: ResultLikeAwaitable<T, E>): ResultAsync<T, E> {
  switch (true) {
    case result instanceof ResultAsync:
      return result;

    case result instanceof ResultOk:
    case result instanceof ResultErr:
      return new ResultAsync(Promise.resolve(result as Result<T, E>));

    default:
      return new ResultAsync<T, E>(
        Promise.resolve(result).then(asResult<T, E>),
      );
  }
}

/**
 * Construct a {@link Result} from a value. If the value is neither null or
 * undefined, the result is `Ok`.
 *
 * Otherwise, the result is `Err` containing:

 * - the returned value from the error function when provided;
 * - or `true` otherwise.
 *
 * @example
 *
 * ```ts
 * const result: Result<User, Error> = Result.$nonNullable(
 *    users.find((user) => user.id === currentUserId),
 *    () => new Error("User not found"),
 * );
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$nonNullable("test");
 *
 * assert.equal(err, undefined);
 * assert.equal(value, "test");
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$nonNullable(null);
 *
 * assert.equal(err, true);
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$nonNullable(null, () => "error");
 *
 * assert.equal(err, "error");
 * assert.equal(value, undefined);
 * ```
 */
function $nonNullable<const T>(value: T): Result<NonNullable<T>, true>;
function $nonNullable<const T, E>(
  value: T,
  error: () => E,
): Result<NonNullable<T>, E>;
function $nonNullable<T, E>(
  value: T,
  error: () => E = mapTrue,
): Result<NonNullable<T>, E> {
  if (value !== null && value !== undefined) {
    return Ok(value);
  }

  return Err(error());
}

/**
 * Construct a {@link Result} from a value. If the value is truthy, the result
 * is `Ok`.
 *
 * Otherwise, the result is `Err` containing:
 *
 * - the returned value from the error function when provided;
 * - or `true` otherwise.
 *
 * @example
 *
 * ```ts
 * const result: Result<string, Error> = Result.$truthy(
 *    username.trim(),
 *    () => new Error("Username is empty"),
 * );
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$truthy("test");
 *
 * assert.equal(err, undefined);
 * assert.equal(value, "test");
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$truthy("");
 *
 * assert.equal(err, true);
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$truthy(0, () => "error");
 *
 * assert.equal(err, "error");
 * assert.equal(value, undefined);
 * ```
 */
function $truthy<const T>(value: T): Result<Truthy<T>, true>;
function $truthy<const T, E>(value: T, error: () => E): Result<Truthy<T>, E>;
function $truthy<T, E>(
  value: T,
  error: () => E = mapTrue,
): Result<Truthy<T>, E> {
  if (value) {
    return Ok(value as Truthy<T>);
  }

  return Err(error());
}

/**
 * Construct a {@link Result} from a common discriminated union shape. If the
 * union is 'success' then the result is `Ok`
 *
 * Otherwise, the result is `Err` containing:
 *
 * - the returned value from the error function when provided;
 * - or `true` otherwise.
 *
 * @example
 *
 * ```ts
 * const result: Result<string, Error> = Result.$truthy(
 *    username.trim(),
 *    () => new Error("Username is empty"),
 * );
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$truthy("test");
 *
 * assert.equal(err, undefined);
 * assert.equal(value, "test");
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$truthy("");
 *
 * assert.equal(err, true);
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$truthy(0, () => "error");
 *
 * assert.equal(err, "error");
 * assert.equal(value, undefined);
 * ```
 */
function $fromUnion<U extends ObjectUnionOk<any> | ObjectUnionErr<any>>(
  union: U,
): Result<
  U extends ObjectUnionOk<infer T> ? T : never,
  U extends ObjectUnionErr<infer E> ? E : never
> {
  if (union.success === true) {
    return Ok(union.data);
  }

  if (union.success === false) {
    return Err(union.error);
  }

  throw new RetupleInvalidUnionError(union);
}

/**
 * Construct a {@link Result} from a synchronous function call. If the function
 * returns without throwing, the result is `Ok`.
 *
 * Otherwise, the result is `Err` containing (in priority order):
 *
 * - the returned value from the map error function when provided;
 * - the thrown error when it is an instance of `Error`;
 * - `RetupleCaughtValueError` when a non `Error` instance is thrown.
 *
 * @example
 *
 * ```ts
 * const result: Result<URL, Error> = Result.$safe(
 *    () => new URL(user.url),
 *    () => new Error("Invalid URL"),
 * );
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$safe(() => "test");
 *
 * assert.equal(err, undefined);
 * assert.equal(value, "test");
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$safe(
 *    () => {
 *       throw new Error("throws");
 *    },
 *    () => "error",
 * );
 *
 * assert.equal(err, "error");
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$safe(
 *    () => {
 *       throw new Error("throws")
 *    },
 * );
 *
 * assert(err instanceof Error && err.message === "throws");
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = Result.$safe(() => {
 *    throw "non error";
 * });
 *
 * assert(err instanceof RetupleCaughtValueError && err.value === "non error");
 * assert.equal(value, undefined);
 */
function $safe<T>(f: () => Awaited<T>): Result<T, Error>;
function $safe<T, E>(
  f: () => Awaited<T>,
  mapError: (err: unknown) => E,
): Result<T, E>;
function $safe<T, E>(
  f: () => Awaited<T>,
  mapError: (err: unknown) => E = ensureError,
): Result<T, E> {
  try {
    return Ok(f());
  } catch (err) {
    return Err(mapError(err));
  }
}

/**
 * Construct a {@link ResultAsync} from a function call. If the function returns
 * without throwing, and any promise returned resolves, the result is `Ok`.
 *
 * Otherwise, the result is `Err` containing (in priority order):
 *
 * - the returned value from the map error function when provided;
 * - the thrown/rejected error when it is an instance of `Error`;
 * - `RetupleCaughtValueError` when throwing/rejecting with a non `Error`.
 *
 * @example
 *
 * ```ts
 * const result: Result<Response, Error> = await Result.$safeAsync(
 *    () => fetch("http://example.com/api"),
 *    () => new Error("Fetch failed"),
 * );
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safeAsync(async () => "test");
 *
 * assert.equal(err, undefined);
 * assert.equal(value, "test");
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safeAsync(
 *    async () => {
 *       throw new Error("throws");
 *    },
 *    () => "error",
 * );
 *
 * assert.equal(err, "error");
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safeAsync(
 *    async () => {
 *       throw new Error("throws")
 *    },
 * );
 *
 * assert(err instanceof Error && err.message === "throws");
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safeAsync(async () => {
 *    throw "non error";
 * });
 *
 * assert(err instanceof RetupleCaughtValueError && err.value === "non error");
 * assert.equal(value, undefined);
 */
function $safeAsync<T>(f: () => T | PromiseLike<T>): ResultAsync<T, Error>;
function $safeAsync<T, E>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E,
): ResultAsync<T, E>;
function $safeAsync<T, E>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E = ensureError,
): ResultAsync<T, E> {
  return new ResultAsync<T, E>(
    (async () => {
      try {
        return Ok(await f());
      } catch (err) {
        return Err(await mapError(err));
      }
    })(),
  );
}

/**
 * Construct a {@link Result} from a promise. If the promise resolves, the
 * result is `Ok`.
 *
 * Otherwise, the result is `Err` containing (in priority order):
 *
 * - the returned value from the map error function when provided;
 * - the rejected error when it is an instance of `Error`;
 * - `RetupleCaughtValueError` when rejecting with a non `Error`.
 *
 * @example
 *
 * ```ts
 * const result: Result<Response, Error> = await Result.$safePromise(
 *    fetch("http://example.com/api"),
 *    () => new Error("Fetch failed"),
 * );
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safePromise(Promise.resolve("test"));
 *
 * assert.equal(err, undefined);
 * assert.equal(value, "test");
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safePromise(
 *    Promise.reject(new Error("rejects")),
 *    () => "error",
 * );
 *
 * assert.equal(err, "error");
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safePromise(
 *    Promise.reject(new Error("rejects")),
 * );
 *
 * assert(err instanceof Error && err.message === "rejects");
 * assert.equal(value, undefined);
 * ```
 *
 * @example
 *
 * ```ts
 * const [err, value] = await Result.$safeAsync(
 *    Promise.reject("non error"),
 * );
 *
 * assert(err instanceof RetupleCaughtValueError && err.value === "non error");
 * assert.equal(value, undefined);
 */
function $safePromise<T>(promise: PromiseLike<T>): ResultAsync<T, Error>;
function $safePromise<T, E>(
  promise: PromiseLike<T>,
  mapError: (err: unknown) => E,
): ResultAsync<T, E>;
function $safePromise<T, E>(
  promise: PromiseLike<T>,
  mapError: (err: unknown) => E = ensureError,
): ResultAsync<T, E> {
  return new ResultAsync<T, E>(
    promise.then(Ok<T>, async (err) => Err(await mapError(err))),
  );
}

/**
 * Construct a {@link ResultRetry} from a function which returns a
 * {@link Result}. The function will be retried based on provided retry
 * settings and eventually return a `Result`. No attempt is made to catch
 * thrown errors or promise rejections.
 *
 * To retry a potentially unsafe function, use {@link Result.$safeRetry}.
 *
 * @example
 *
 * ```ts
 * // Retry someResultFn up to 3 times until Ok is returned,
 * // with a 1 second delay between each invocation:
 * const result = await Result.$retry(someResultFn).$times(3).$delay(1000);
 * ```
 */
function $retry<T, E>(
  f: () => ResultLike<T, E> | PromiseLike<ResultLike<T, E>>,
): ResultRetry<T, E> {
  return new ResultRetry(f);
}

/**
 * Construct a {@link ResultRetry} from a function. Uses the same strategy as
 * {@link Result.$safeAsync}, equivalent to calling:
 *
 * ```ts
 * Result.$retry(() => Result.$safeAsync(...));
 * ```
 *
 * @example
 *
 * ```ts
 * // Retry the fetch up to 3 times until it succeeds
 * // with a 1 second delay between each invocation:
 * const result: Result<Response, Error> = await Result
 *    .$safeRetry(
 *       () => fetch("http://example.com/api"),
 *       () => new Error("Fetch failed"),
 *    )
 *    .$times(3)
 *    .$delay(1000)
 *    .$handle(({ attempt }) => console.log("Attempt:", attempt));
 * ```
 */
function $safeRetry<T>(f: () => T | PromiseLike<T>): ResultRetry<T, Error>;
function $safeRetry<T, E>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E,
): ResultRetry<T, E>;
function $safeRetry<T, E = Error>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E = ensureError,
): ResultRetry<T, E> {
  return new ResultRetry(async () => {
    try {
      return Ok(await f());
    } catch (err) {
      return Err(mapError(err));
    }
  });
}

/**
 * Construct a {@link Result} from an array of results. If all are Ok,
 * then the result is `Ok` containing a tuple of values. Otherwise,
 * the result is `Err` containing the first error encountered.
 *
 * @example
 *
 * ```ts
 * const result: Result<[string, number], Error | string> = Result.$all([
 *   Result.$truthy(stringValue, () => new Error("Invalid string")),
 *   Result.$truthy(numberValue, () => "Invalid number"),
 * ]);
 * ```
 *
 * @example
 *
 * ```ts
 * const tuple: [1, 2, 3] = Result.$all([
 *   Ok(1),
 *   Ok(2),
 *   Ok(3),
 * ]).$unwrap();
 * ```
 *
 * @example
 *
 * ```ts
 * const error: "error" = Result.$all([
 *   Ok(1),
 *   Err("error"),
 *   Ok(3),
 * ]).$unwrapErr();
 * ```
 */
function $all<const TResults extends ResultLike<any, any>[]>(
  results: TResults,
): Result<AllOk<TResults>, AllErr<TResults>> {
  const oks: any[] = [];

  for (const result of results) {
    const { ok, value } = result[ResultLikeSymbol]();

    if (ok) {
      oks.push(value);
    } else {
      return Err(value);
    }
  }

  return Ok(oks as AllOk<TResults>);
}

/**
 * The same as {@link Result.$all|$all} except it accepts result-like
 * promises and returns {@link ResultAsync}.
 */
function $allPromised<const TResults extends ResultLikeAwaitable<any, any>[]>(
  results: TResults,
): ResultAsync<AllOk<TResults>, AllErr<TResults>> {
  return new ResultAsync(
    new Promise((resolve, reject) => {
      void Promise.all(
        results.map((result) =>
          Promise.resolve(result).then(
            (result) => {
              const { ok, value } = result[ResultLikeSymbol]();

              return ok ? value : Promise.reject(value);
            },
            (err) => {
              reject(err);

              // Because reject has been called, we can safely return an
              // empty rejection to ensure we don't end up with undefined
              // in the Ok path. The subsequent call to resolve will not
              // change the state of the Promise.
              return Promise.reject();
            },
          ),
        ),
      ).then(
        (values) => resolve(Ok(values as AllOk<TResults>)),
        (err) => resolve(Err(err)),
      );
    }),
  );
}

/**
 * Construct a {@link Result} from an array of results. If any are Ok,
 * then the result is `Ok` containing the first value encountered.
 * Otherwise, the result is `Err` containing a tuple of errors.
 *
 * @example
 *
 * ```ts
 * const result: Result<string | number, [Error, string]> = Result.$any([
 *   Result.$truthy(stringValue, () => new Error("Invalid string")),
 *   Result.$truthy(numberValue, () => "Invalid number"),
 * ]);
 * ```
 *
 * @example
 *
 * ```ts
 * const tuple: 2 = Result.$any([
 *   Err("error1"),
 *   Ok(2),
 *   Err("error3"),
 * ]).$unwrap();
 * ```
 *
 * @example
 *
 * ```ts
 * const error: ["error1", "error2", "error3"] = Result.$any([
 *   Err("error1"),
 *   Err("error2"),
 *   Err("error3"),
 * ]).$unwrapErr();
 * ```
 */
function $any<const TResults extends ResultLike<any, any>[]>(
  results: TResults,
): Result<AnyOk<TResults>, AnyErr<TResults>> {
  const errs: any[] = [];

  for (const result of results) {
    const { ok, value } = result[ResultLikeSymbol]();

    if (ok) {
      return Ok(value);
    } else {
      errs.push(value);
    }
  }

  return Err(errs as AnyErr<TResults>);
}

/**
 * The same as {@link Result.$any|$any} except it accepts result-like
 * promises and returns {@link ResultAsync}.
 */
function $anyPromised<const TResults extends ResultLikeAwaitable<any, any>[]>(
  results: TResults,
): ResultAsync<AnyOk<TResults>, AnyErr<TResults>> {
  return new ResultAsync(
    new Promise((resolve, reject) => {
      let rejected = false;

      void Promise.any(
        results.map((result) =>
          Promise.resolve(result).then(
            (result) => {
              const { ok, value } = result[ResultLikeSymbol]();

              return ok ? value : Promise.reject(value);
            },
            (err) => {
              rejected = true;

              return Promise.reject(err);
            },
          ),
        ),
      ).then(
        (value) => resolve(Ok(value)),
        (err) =>
          err instanceof AggregateError && rejected === false
            ? resolve(Err(err.errors as AnyErr<TResults>))
            : reject(err),
      );
    }),
  );
}

/**
 * Construct a {@link Result} from an object of results. If all are Ok,
 * then the result is `Ok` containing an object of the values. Otherwise,
 * the result is `Err` containing the first error encountered.
 *
 * @example
 *
 * ```ts
 * const result: Result<
 *   { test1: string, test2: number},
 *   string | Error,
 * > = Result.$collect({
 *   test1: Result.$truthy(stringValue, () => new Error("Invalid string")),
 *   test2: Result.$truthy(numberValue, () => "Invalid number"),
 * ]);
 * ```
 *
 * @example
 *
 * ```ts
 * const object: { a: 1, b: 2 } = Result.$collect({
 *   a: Ok(1),
 *   b: Ok(2),
 * }).$unwrap();
 * ```
 *
 * @example
 *
 * ```ts
 * const error: "error" = Result.$collect({
 *   a: Ok(1),
 *   b: Err("error"),
 * }).$unwrapErr();
 * ```
 */
function $collect<TResults extends Record<string, ResultLike<any, any>>>(
  results: TResults,
): Result<CollectOk<TResults>, CollectErr<TResults>> {
  const oks: Record<string, any> = {};

  for (const [key, result] of Object.entries(results)) {
    const { ok, value } = result[ResultLikeSymbol]();

    if (ok) {
      oks[key] = value;
    } else {
      return Err(value);
    }
  }

  return Ok(oks as CollectOk<TResults>);
}

/**
 * The same as {@link Result.$collect|$collect} except it accepts result-like
 * promises and returns {@link ResultAsync}.
 */
function $collectPromised<
  TResults extends Record<string, ResultLikeAwaitable<any, any>>,
>(results: TResults): ResultAsync<CollectOk<TResults>, CollectErr<TResults>> {
  return new ResultAsync(
    new Promise((resolve, reject) => {
      void Promise.all(
        Object.entries(results).map(([key, result]) =>
          Promise.resolve(result).then(
            (result) => {
              const { ok, value } = result[ResultLikeSymbol]();

              return ok ? ([key, value] as const) : Promise.reject(value);
            },
            (err) => {
              reject(err);

              // Because reject has been called, we can safely return an
              // empty rejection to ensure we don't end up with undefined
              // in the Ok path. The subsequent call to resolve will not
              // change the state of the Promise.
              return Promise.reject();
            },
          ),
        ),
      ).then(
        (values) =>
          resolve(Ok(Object.fromEntries(values) as CollectOk<TResults>)),
        (err) => resolve(Err(err)),
      );
    }),
  );
}

/**
 * Construct a `Result` by executing a series of functions which each return
 * results. Each function in the chain receives the `Ok` value from the
 * previous result. Returns `Ok` containing the final value in the chain.
 *
 * If `Err` is encountered anywhere in the chain, no further functions are
 * called and the `Err` is returned.
 *
 * @example
 *
 * ```ts
 * function divide(x: number, by: number): Result<number, string> {
 *   if (by === 0) {
 *     return Err("Can't divide by zero");
 *   }
 *
 *   return x / by;
 * }
 *
 * const five: Result<number, string> = Result.$pipe(
 *   () => divide(100, 2), // 100 / 2
 *   (y) => divide(y, 5),  // 50 / 5
 *   (z) => divide(z, 2),  // 10 / 2
 * );
 *
 * assert.equal(five.$unwrap(), 5);
 * ```
 *
 * @example
 *
 * ```ts
 * const error: Result<number, string> = Result.$pipe(
 *   () => divide(100, 2), // 100 / 2,
 *   (y) => divide(y, 0),  // 50 / 0 (error)
 *   (z) => divide(z, 2),  // never executed
 * );
 *
 * assert.equal(error.$unwrapErr(), "Can't divide by zero");
 * ```
 */
function $pipe<T0, E0, T1, E1>(
  f0: () => ResultLike<T0, E0>,
  f1: (val0: T0) => ResultLike<T1, E1>,
): Result<T1, E0 | E1>;
function $pipe<T0, E0, T1, E1, T2, E2>(
  f0: () => ResultLike<T0, E0>,
  f1: (val0: T0) => ResultLike<T1, E1>,
  f2: (val1: T1) => ResultLike<T2, E2>,
): Result<T2, E0 | E1 | E2>;
function $pipe<T0, E0, T1, E1, T2, E2, T3, E3>(
  f0: () => ResultLike<T0, E0>,
  f1: (val0: T0) => ResultLike<T1, E1>,
  f2: (val1: T1) => ResultLike<T2, E2>,
  f3: (val2: T2) => ResultLike<T3, E3>,
): Result<T3, E0 | E1 | E2 | E3>;
function $pipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4>(
  f0: () => ResultLike<T0, E0>,
  f1: (val0: T0) => ResultLike<T1, E1>,
  f2: (val1: T1) => ResultLike<T2, E2>,
  f3: (val2: T2) => ResultLike<T3, E3>,
  f4: (val3: T3) => ResultLike<T4, E4>,
): Result<T4, E0 | E1 | E2 | E3 | E4>;
function $pipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5>(
  f0: () => ResultLike<T0, E0>,
  f1: (val0: T0) => ResultLike<T1, E1>,
  f2: (val1: T1) => ResultLike<T2, E2>,
  f3: (val2: T2) => ResultLike<T3, E3>,
  f4: (val3: T3) => ResultLike<T4, E4>,
  f5: (val4: T4) => ResultLike<T5, E5>,
): Result<T5, E0 | E1 | E2 | E3 | E4 | E5>;
function $pipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6>(
  f0: () => ResultLike<T0, E0>,
  f1: (val0: T0) => ResultLike<T1, E1>,
  f2: (val1: T1) => ResultLike<T2, E2>,
  f3: (val2: T2) => ResultLike<T3, E3>,
  f4: (val3: T3) => ResultLike<T4, E4>,
  f5: (val4: T4) => ResultLike<T5, E5>,
  f6: (val5: T5) => ResultLike<T6, E6>,
): Result<T6, E0 | E1 | E2 | E3 | E4 | E5 | E6>;
function $pipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6, T7, E7>(
  f0: () => ResultLike<T0, E0>,
  f1: (val0: T0) => ResultLike<T1, E1>,
  f2: (val1: T1) => ResultLike<T2, E2>,
  f3: (val2: T2) => ResultLike<T3, E3>,
  f4: (val3: T3) => ResultLike<T4, E4>,
  f5: (val4: T4) => ResultLike<T5, E5>,
  f6: (val5: T5) => ResultLike<T6, E6>,
  f7: (val6: T6) => ResultLike<T7, E7>,
): Result<T7, E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7>;
function $pipe(
  f0: () => ResultLike<any, any>,
  ...fnx: ((val: any) => ResultLike<any, any>)[]
): Result<any, any> {
  const first = asResult(f0());

  if (first instanceof ResultErr) {
    return first;
  }

  let current: any = first[1];

  for (const fn of fnx) {
    const result = asResult(fn(current));

    if (result instanceof ResultErr) {
      return result;
    }

    current = result[1];
  }

  return Ok(current);
}

/**
 * The same as {@link Result.$pipe|$pipe} except it accepts async functions
 * and returns {@link ResultAsync}.
 */
function $pipeAsync<T0, E0, T1, E1>(
  f0: () => ResultLikeAwaitable<T0, E0>,
  f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
): ResultAsync<T1, E0 | E1>;
function $pipeAsync<T0, E0, T1, E1, T2, E2>(
  f0: () => ResultLikeAwaitable<T0, E0>,
  f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
): ResultAsync<T2, E0 | E1 | E2>;
function $pipeAsync<T0, E0, T1, E1, T2, E2, T3, E3>(
  f0: () => ResultLikeAwaitable<T0, E0>,
  f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
  f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
): ResultAsync<T3, E0 | E1 | E2 | E3>;
function $pipeAsync<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4>(
  f0: () => ResultLikeAwaitable<T0, E0>,
  f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
  f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
  f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
): ResultAsync<T4, E0 | E1 | E2 | E3 | E4>;
function $pipeAsync<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5>(
  f0: () => ResultLikeAwaitable<T0, E0>,
  f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
  f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
  f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
  f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
): ResultAsync<T5, E0 | E1 | E2 | E3 | E4 | E5>;
function $pipeAsync<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6>(
  f0: () => ResultLikeAwaitable<T0, E0>,
  f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
  f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
  f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
  f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
  f6: (val5: T5) => ResultLikeAwaitable<T6, E6>,
): ResultAsync<T6, E0 | E1 | E2 | E3 | E4 | E5 | E6>;
function $pipeAsync<
  T0,
  E0,
  T1,
  E1,
  T2,
  E2,
  T3,
  E3,
  T4,
  E4,
  T5,
  E5,
  T6,
  E6,
  T7,
  E7,
>(
  f0: () => ResultLikeAwaitable<T0, E0>,
  f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
  f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
  f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
  f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
  f6: (val5: T5) => ResultLikeAwaitable<T6, E6>,
  f7: (val6: T6) => ResultLikeAwaitable<T7, E7>,
): ResultAsync<T7, E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7>;
function $pipeAsync(
  f0: () => ResultLikeAwaitable<any, any>,
  ...fnx: ((val: any) => ResultLikeAwaitable<any, any>)[]
): ResultAsync<any, any> {
  return new ResultAsync(
    (async () => {
      const first = asResult(await f0());

      if (first instanceof ResultErr) {
        return first;
      }

      let current: any = first[1];

      for (const fn of fnx) {
        const result = asResult(await fn(current));

        if (result instanceof ResultErr) {
          return result;
        }

        current = result[1];
      }

      return Ok(current);
    })(),
  );
}

/**
 * ## ResultOk
 *
 * This is the `Ok` variant of a `Result`, used internally and not exported.
 */
class ResultOk<T, E> extends Array<T | undefined> implements Retuple<T, E> {
  declare 0: undefined;
  declare 1: T;
  declare length: 2;

  constructor(value: T) {
    super(2);

    this[0] = undefined;
    this[1] = value;
  }

  [ResultLikeSymbol](): ResultLikeOk<T> {
    return { ok: true, value: this[1] } as const;
  }

  toJSON(this: ThisOk<T>): T {
    return this[1];
  }

  $isOk(this: ThisOk<T>): this is ThisOk<T> {
    return true;
  }

  $isOkAnd<U extends T>(
    this: ThisOk<T>,
    f: ((val: T) => val is U) | ((val: T) => boolean),
  ): this is ThisOk<U> {
    return !!f(this[1] as T);
  }

  $isErr(this: ThisOk<T>): this is never {
    return false;
  }

  $isErrAnd(this: ThisOk<T>): this is never {
    return false;
  }

  $expect(this: ThisOk<T>): T {
    return this[1];
  }

  $unwrap(this: ThisOk<T>): T {
    return this[1];
  }

  $unwrapErr(this: ThisOk<T>, msg?: string): never {
    throw new RetupleUnwrapErrFailed(this[1], msg);
  }

  $unwrapOr(this: ThisOk<T>): T {
    return this[1];
  }

  $unwrapOrElse(this: ThisOk<T>): T {
    return this[1];
  }

  $map<U>(this: ThisOk<T>, f: (value: T) => U): Result<U, never> {
    return Ok(f(this[1]));
  }

  $mapErr(this: ThisOk<T>): ThisOk<T> {
    return this;
  }

  $mapOr<U, V>(this: ThisOk<T>, _def: U, f: (val: T) => V): Result<V, never> {
    return Ok(f(this[1]));
  }

  $mapOrElse<U, V>(
    this: ThisOk<T>,
    _def: (err: E) => U,
    f: (val: T) => V,
  ): Result<V, never> {
    return Ok(f(this[1]));
  }

  $assert<F>(
    this: ThisOk<T>,
    mapError?: (val: Falsey<T>) => F,
  ): Result<Truthy<T>, F | RetupleAssertFailed<T>> {
    return this[1]
      ? (this as ThisOk<Truthy<T>>)
      : Err(
          mapError
            ? mapError(this[1] as Falsey<T>)
            : new RetupleAssertFailed(this[1]),
        );
  }

  $filter<U extends T, F>(
    this: ThisOk<T>,
    filter: (val: T) => val is U,
    mapError?: (val: T) => F,
  ): Result<U, F | RetupleFilterFailed<T>> {
    return filter(this[1])
      ? (this as ThisOk<U>)
      : Err(mapError ? mapError(this[1]) : new RetupleFilterFailed(this[1]));
  }

  $atIndex<U, F>(
    this: ThisOk<readonly U[]>,
    index: number,
    mapError?: (val: T) => F,
  ): Result<Truthy<U>, F | RetupleIndexFailed<T>> {
    const element = this[1]![index];

    return element
      ? Ok(element as Truthy<U>)
      : Err(
          mapError
            ? mapError(this[1] as T)
            : new RetupleIndexFailed(index, this[1] as T),
        );
  }

  $firstIndex<U, F>(
    this: ThisOk<readonly U[]>,
    mapError?: (val: T) => F,
  ): Result<Truthy<U>, F | RetupleFilterFailed<T>> {
    const first = this[1]![0];

    return first
      ? Ok(first as Truthy<U>)
      : Err(
          mapError
            ? mapError(this[1] as T)
            : new RetupleIndexFailed(0, this[1] as T),
        );
  }

  $or(this: ThisOk<T>): ThisOk<T> {
    return this;
  }

  $orAsync(this: ThisOk<T>): ResultAsync<T, never> {
    return this.$async();
  }

  $orElse(this: ThisOk<T>): ThisOk<T> {
    return this;
  }

  $orElseAsync(this: ThisOk<T>): ResultAsync<T, never> {
    return this.$async();
  }

  $orSafe(this: ThisOk<T>): ThisOk<T> {
    return this;
  }

  $orSafeAsync(this: ThisOk<T>): ResultAsync<T, never> {
    return this.$async();
  }

  $orSafePromise(this: ThisOk<T>): ResultAsync<T, never> {
    return this.$async();
  }

  $and<U, F>(this: ThisOk<T>, and: ResultLike<U, F>): Result<U, F> {
    return asResult(and);
  }

  $andAsync<U, F>(
    this: ThisOk<T>,
    and: ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, F> {
    return this.$async().$and(and);
  }

  $andThen<U, F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLike<U, F>,
  ): Result<U, F> {
    return asResult(f(this[1]));
  }

  $andStack<U, F, S extends [...any[], any] = [...any[], any]>(
    this: ThisOk<Stack<S>>,
    f: (val: T) => ResultLike<U, F>,
  ): Result<Stack<[...S, U]>, F>;
  $andStack<U, F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLike<U, F>,
  ): Result<Stack<[T, U]>, F>;
  $andStack<U, F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLike<U, F>,
  ): Result<Stack, F> {
    const res = asResult(f(this[1]));

    if (res instanceof ResultErr) {
      return res;
    }

    if (this[1] instanceof RetupleStack) {
      return Ok(new RetupleStack(...this[1], res[1]) as Stack);
    } else {
      return Ok(new RetupleStack(this[1], res[1]) as Stack);
    }
  }

  $andThenAsync<U, F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, F> {
    return this.$async().$andThen(f);
  }

  $andStackAsync<U, F, S extends [...any[], any]>(
    this: ThisOk<Stack<S>>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack<[...S, U]>, F>;
  $andStackAsync<U, F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack<[T, U]>, F>;
  $andStackAsync<U, F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack, F> {
    return this.$async().$andStack(f);
  }

  $andThrough<F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLike<any, F>,
  ): Result<T, F> {
    const res = asResult(f(this[1]));

    return res instanceof ResultErr ? res : this;
  }

  $andThroughAsync<F>(
    this: ThisOk<T>,
    f: (val: T) => ResultLikeAwaitable<any, F>,
  ): ResultAsync<T, F> {
    return this.$async().$andThrough(f);
  }

  $andSafe<U, F>(
    this: ThisOk<T>,
    f: (val: T) => U,
    mapError: (err: unknown) => F = ensureError,
  ): Result<U, F> {
    try {
      return Ok(f(this[1]));
    } catch (err) {
      return Err(mapError(err));
    }
  }

  $andSafeAsync<U, F>(
    this: ThisOk<T>,
    f: (val: T) => PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<U, F> {
    return this.$async().$andSafe(f, mapError);
  }

  $andSafePromise<U, F>(
    this: ThisOk<T>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<U, F> {
    return this.$async().$andSafePromise(promise, mapError);
  }

  $andPipe(
    this: ThisOk<T>,
    f0: (val: T) => Result<any, any>,
    ...fx: ((val: any) => Result<any, any>)[]
  ): Result<any, any> {
    return Result.$pipe(() => f0(this[1]), ...(fx as [() => Result<any, any>]));
  }

  $andPipeAsync(
    this: ThisOk<T>,
    f0: (val: T) => ResultLikeAwaitable<any, any>,
    ...fx: ((val: any) => ResultLikeAwaitable<any, any>)[]
  ): ResultAsync<any, any> {
    return Result.$pipeAsync(
      () => f0(this[1]),
      ...(fx as [() => Result<any, any>]),
    );
  }

  $peek(this: ThisOk<T>, f: (res: Result<T, E>) => void): ThisOk<T> {
    f(this);

    return this;
  }

  $tap(this: ThisOk<T>, f: (val: T) => any): ThisOk<T> {
    f(this[1]);

    return this;
  }

  $tapErr(this: ThisOk<T>): ThisOk<T> {
    return this;
  }

  $flatten<U, F>(this: Result<Result<U, F>, E>): Result<U, F> {
    return this[1] as Result<U, F>;
  }

  $async(this: ThisOk<T>): ResultAsync<T, never> {
    return new ResultAsync<T, never>(Promise.resolve(this));
  }

  $promise(this: ThisOk<T>): Promise<ThisOk<T>> {
    return Promise.resolve(this);
  }

  *$iter<U>(
    this: ThisOk<Iterable<U>>,
  ): IterableIterator<U, undefined, unknown> {
    yield* this[1];
  }
}

/**
 * ## ResultErr
 *
 * This is the `Err` variant of a `Result`, used internally and not exported.
 */
class ResultErr<T, E> extends Array<E | undefined> implements Retuple<T, E> {
  declare 0: E;
  declare 1: undefined;
  declare length: 2;

  constructor(err: E) {
    super(2);

    this[0] = err;
    this[1] = undefined;
  }

  [ResultLikeSymbol](): ResultLikeErr<E> {
    return { ok: false, value: this[0] };
  }

  toJSON(this: ThisErr<E>): null {
    return null;
  }

  $isOk(this: ThisErr<E>): this is never {
    return false;
  }

  $isOkAnd(this: ThisErr<E>): this is never {
    return false;
  }

  $isErr(this: ThisErr<E>): this is ThisErr<E> {
    return true;
  }

  $isErrAnd<F extends E>(
    this: ThisErr<E>,
    f: ((err: E) => err is F) | ((err: E) => boolean),
  ): this is ThisErr<F> {
    return !!f(this[0]);
  }

  $expect(this: ThisErr<Error>): never {
    if (this[0] instanceof Error) {
      throw this[0];
    }

    throw new RetupleExpectFailed(this[0]);
  }

  $unwrap(this: ThisErr<E>, msg?: string): T {
    throw new RetupleUnwrapFailed(this[0], msg);
  }

  $unwrapErr(this: ThisErr<E>): E {
    return this[0] as E;
  }

  $unwrapOr<U>(this: ThisErr<E>, def: U): U {
    return def;
  }

  $unwrapOrElse<U>(this: ThisErr<E>, f: () => U): U {
    return f();
  }

  $map(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $mapErr<F>(this: ThisErr<E>, f: (err: E) => F): Result<never, F> {
    return Err(f(this[0]));
  }

  $mapOr<U>(this: ThisErr<E>, def: U): Result<U, never> {
    return Ok(def);
  }

  $mapOrElse<U>(this: ThisErr<E>, def: (err: E) => U): Result<U, never> {
    return Ok(def(this[0]));
  }

  $assert(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $filter(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $atIndex(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $firstIndex(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $or<U, F>(this: ThisErr<E>, or: ResultLike<U, F>): Result<U, F> {
    return asResult(or);
  }

  $orAsync<U, F>(
    this: ThisErr<E>,
    or: ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, F> {
    return this.$async().$or(or);
  }

  $orElse<U, F>(
    this: ThisErr<E>,
    f: (err: E) => ResultLike<U, F>,
  ): Result<U, F> {
    return asResult(f(this[0]));
  }

  $orElseAsync<U, F>(
    this: ThisErr<E>,
    f: (err: E) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, F> {
    return this.$async().$orElse(f);
  }

  $orSafe<U, F>(
    this: ThisErr<E>,
    f: (err: E) => U,
    mapError: (err: unknown) => F = ensureError,
  ): Result<U, F> {
    try {
      return Ok(f(this[0]));
    } catch (err) {
      return Err(mapError(err));
    }
  }

  $orSafeAsync<U = T, F = E>(
    this: ThisErr<E>,
    f: (err: E) => U | PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<U, F> {
    return this.$async().$orSafe(f, mapError);
  }

  $orSafePromise<U, F>(
    this: ThisErr<E>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<U, F> {
    return this.$async().$orSafePromise(promise, mapError);
  }

  $and(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $andAsync(this: ThisErr<E>): ResultAsync<never, E> {
    return this.$async();
  }

  $andThen(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $andStack(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $andThenAsync(this: ThisErr<E>): ResultAsync<never, E> {
    return this.$async();
  }

  $andStackAsync(this: ThisErr<E>): ResultAsync<never, E> {
    return this.$async();
  }

  $andThrough(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $andThroughAsync(this: ThisErr<E>): ResultAsync<never, E> {
    return this.$async();
  }

  $andSafe(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $andSafeAsync(this: ThisErr<E>): ResultAsync<never, E> {
    return this.$async();
  }

  $andSafePromise(this: ThisErr<E>): ResultAsync<never, E> {
    return this.$async();
  }

  $andPipe(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $andPipeAsync(this: ThisErr<E>): ResultAsync<never, E> {
    return this.$async();
  }

  $peek(this: ThisErr<E>, f: (res: ThisErr<E>) => void): ThisErr<E> {
    f(this);

    return this;
  }

  $tap(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $tapErr(this: ThisErr<E>, f: (err: E) => void): ThisErr<E> {
    f(this[0]);

    return this;
  }

  $flatten(this: ThisErr<E>): ThisErr<E> {
    return this;
  }

  $async(this: ThisErr<E>): ResultAsync<never, E> {
    return new ResultAsync<never, E>(Promise.resolve(this));
  }

  $promise(this: ThisErr<E>): Promise<ThisErr<E>> {
    return Promise.resolve(this);
  }

  *$iter<U>(
    this: Result<Iterable<U>, E>,
  ): IterableIterator<U, undefined, unknown> {
    return;
  }
}

/**
 * ## ResultAsync
 *
 * @TODO
 */
class ResultAsync<T, E> {
  #inner: PromiseLike<Result<T, E>>;

  constructor(inner: PromiseLike<Result<T, E>>) {
    this.#inner = inner;
  }

  then<U = Result<T, E>, F = never>(
    onfulfilled?:
      | ((value: Result<T, E>) => U | PromiseLike<U>)
      | null
      | undefined,
    onrejected?: ((reason: any) => F | PromiseLike<F>) | null | undefined,
  ): PromiseLike<U | F> {
    return this.#inner.then(onfulfilled, onrejected);
  }

  /**
   * The same as {@link Retuple.$expect|$expect}, except it returns a `Promise`.
   */
  async $expect(this: ResultAsync<T, Error>): Promise<T> {
    return (await this.#inner).$expect();
  }

  /**
   * The same as {@link Retuple.$unwrap|$unwrap}, except it returns a `Promise`.
   */
  async $unwrap(this: ResultAsync<T, E>, msg?: string): Promise<T> {
    return (await this.#inner).$unwrap(msg);
  }

  /**
   * The same as {@link Retuple.$unwrapErr|$unwrapErr}, except it returns
   * a `Promise`.
   */
  async $unwrapErr(this: ResultAsync<T, E>, msg?: string): Promise<E> {
    return (await this.#inner).$unwrapErr(msg);
  }

  /**
   * The same as {@link Retuple.$unwrapOr|$unwrapOr}, except it returns
   * a `Promise`.
   */
  async $unwrapOr<const U = T>(
    this: ResultAsync<T, E>,
    def: U,
  ): Promise<T | U> {
    return (await this.#inner).$unwrapOr(def);
  }

  /**
   * The same as {@link Retuple.$unwrapOrElse|$unwrapOrElse}, except it returns
   * a `Promise`.
   */
  async $unwrapOrElse<U = T>(
    this: ResultAsync<T, E>,
    f: () => U,
  ): Promise<T | U> {
    const res = await this.#inner;

    return res instanceof ResultOk ? res[1] : f();
  }

  /**
   * The same as {@link Retuple.$map|$map}, except it returns
   * {@link ResultAsync}.
   */
  $map<U>(this: ResultAsync<T, E>, f: (val: T) => U): ResultAsync<U, E> {
    return new ResultAsync<U, E>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk(f(res[1]))
          : (res as ThisErr<E>);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$mapErr|$mapErr}, except it returns
   * {@link ResultAsync}.
   */
  $mapErr<F = E>(this: ResultAsync<T, E>, f: (err: E) => F): ResultAsync<T, F> {
    return new ResultAsync<T, F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr
          ? new ResultErr(f(res[0]))
          : (res as ThisOk<T>);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$mapOr|$mapOr}, except it returns
   * {@link ResultAsync}.
   */
  $mapOr<U, V = U>(
    this: ResultAsync<T, E>,
    def: U,
    f: (val: T) => V,
  ): ResultAsync<U | V, never> {
    return new ResultAsync<U | V, never>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk<U | V, never>(f(res[1]))
          : new ResultOk(def);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$mapOrElse|$mapOrElse}, except it returns
   * {@link ResultAsync}.
   */
  $mapOrElse<U, V = U>(
    this: ResultAsync<T, E>,
    def: (err: E) => U,
    f: (val: T) => V,
  ): ResultAsync<U | V, never> {
    return new ResultAsync<U | V, never>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk<U | V, never>(f(res[1]))
          : new ResultOk(def(res[0] as E));
      }),
    );
  }

  /**
   * The same as {@link Retuple.$assert|$assert}, except it returns
   * {@link ResultAsync}.
   */
  $assert(
    this: ResultAsync<T, E>,
  ): ResultAsync<Truthy<T>, E | RetupleAssertFailed<T>>;
  $assert<F = E>(
    this: ResultAsync<T, E>,
    mapError: (val: Falsey<T>) => F,
  ): ResultAsync<Truthy<T>, E | F>;
  $assert<F = E>(
    this: ResultAsync<T, E>,
    mapError?: (val: Falsey<T>) => F,
  ): ResultAsync<Truthy<T>, E | F | RetupleAssertFailed<T>> {
    return new ResultAsync<Truthy<T>, E | F | RetupleAssertFailed<T>>(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        return res[1]
          ? (res as Result<Truthy<T>, E>)
          : Err(
              mapError
                ? mapError(res[1] as Falsey<T>)
                : new RetupleAssertFailed(res[1] as T),
            );
      }),
    );
  }

  /**
   * The same as {@link Retuple.$filter|$filter}, except it returns
   * {@link ResultAsync}.
   */
  $filter<U extends T = T>(
    this: ResultAsync<T, E>,
    predicate: (val: T) => val is U,
  ): ResultAsync<U, E | RetupleFilterFailed<T>>;
  $filter(
    this: ResultAsync<T, E>,
    check: (val: T) => unknown,
  ): ResultAsync<T, E | RetupleFilterFailed<T>>;
  $filter<U extends T = T, F = E>(
    this: ResultAsync<T, E>,
    predicate: (val: T) => val is U,
    mapError: (val: T) => F,
  ): ResultAsync<U, E | F>;
  $filter<F = E>(
    this: ResultAsync<T, E>,
    check: (val: T) => unknown,
    mapError: (val: T) => F,
  ): ResultAsync<T, E | F>;
  $filter<U extends T, F = E>(
    this: ResultAsync<T, E>,
    check: ((val: T) => unknown) | ((val: T) => val is U),
    mapError?: (val: T) => F,
  ): ResultAsync<T | U, E | F | RetupleFilterFailed<T>> {
    return new ResultAsync<T | U, E | F | RetupleFilterFailed<T>>(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        return check(res[1] as T)
          ? res
          : Err(
              mapError
                ? mapError(res[1] as T)
                : new RetupleFilterFailed(res[1] as T),
            );
      }),
    );
  }

  /**
   * The same as {@link Retuple.$atIndex|$atIndex}, except it returns
   * {@link ResultAsync}.
   */
  $atIndex<U>(
    this: ResultAsync<readonly U[], E>,
    index: number,
  ): ResultAsync<U, E | RetupleFilterFailed<T>>;
  $atIndex<U, F = E>(
    this: ResultAsync<readonly U[], E>,
    index: number,
    mapError: (val: T) => F,
  ): ResultAsync<U, E | F>;
  $atIndex<U, F = E>(
    this: ResultAsync<readonly U[], E>,
    index: number,
    mapError?: (val: T) => F,
  ): ResultAsync<U, E | F | RetupleFilterFailed<T>> {
    return new ResultAsync<U, E | F | RetupleFilterFailed<T>>(
      this.#inner.then((res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        const element = res[1]![index];

        return element
          ? Ok(element)
          : Err(
              mapError
                ? mapError(res[1] as T)
                : new RetupleIndexFailed(index, res[1] as T),
            );
      }),
    );
  }

  /**
   * The same as {@link Retuple.$firstIndex|$firstIndex}, except it returns
   * {@link ResultAsync}.
   */
  $firstIndex<U>(
    this: ResultAsync<readonly U[], E>,
  ): ResultAsync<U, E | RetupleIndexFailed<T>>;
  $firstIndex<U, F = E>(
    this: ResultAsync<readonly U[], E>,
    mapError: (val: T) => F,
  ): ResultAsync<U, E | F>;
  $firstIndex<U, F = E>(
    this: ResultAsync<readonly U[], E>,
    mapError?: (val: T) => F,
  ): ResultAsync<U, E | F | RetupleIndexFailed<T>> {
    return new ResultAsync<U, E | F | RetupleIndexFailed<T>>(
      this.#inner.then((res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        const first = res[1]![0];

        return first
          ? Ok(first)
          : Err(
              mapError
                ? mapError(res[1] as T)
                : new RetupleIndexFailed(0, res[1] as T),
            );
      }),
    );
  }

  /**
   * The same as {@link Retuple.$or|$or}, except it:
   *
   * - can also accept a `PromiseLike` or value;
   * - returns {@link ResultAsync}.
   */
  $or<U = T, F = E>(
    this: ResultAsync<T, E>,
    or: ResultLikeAwaitable<U, F>,
  ): ResultAsync<T | U, F>;
  $or<U, F>(
    this: ResultAsync<T, E>,
    or: ResultLikeAwaitable<U, F>,
  ): ResultAsync<T | U, F> {
    return new ResultAsync<T | U, F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr
          ? asResult(await or)
          : (res as ThisOk<T>);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$orElse|$orElse}, except it:
   *
   * - can also accept an `async` or function;
   * - returns {@link ResultAsync}.
   */
  $orElse<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (err: E) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<T | U, F>;
  $orElse<U = never, F = never>(
    this: ResultAsync<T, E>,
    f: (err: E) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<T | U, F> {
    return new ResultAsync<T | U, F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr
          ? asResult(await f(res[0] as E))
          : (res as ThisOk<T>);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$orSafe|$orSafe}, except it:
   *
   * - can also accept an `async` safe function;
   * - returns {@link ResultAsync}.
   */
  $orSafe<U = T>(
    this: ResultAsync<T, E>,
    f: (err: E) => U | PromiseLike<U>,
  ): ResultAsync<T | U, Error>;
  $orSafe<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (err: E) => U | PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<T | U, F>;
  $orSafe<U, F>(
    this: ResultAsync<T, E>,
    f: (err: E) => U | PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<T | U, F | Error> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultOk) {
          return res;
        }

        try {
          return new ResultOk(await f(res[0] as E));
        } catch (err) {
          return new ResultErr(mapError(err));
        }
      }),
    );
  }

  /**
   * Returns {@link ResultAsync} based on the outcome of the promise when this
   * result is `Err`.
   *
   * Otherwise, returns `Ok` containing the current contained value.
   *
   * Uses the same strategy as {@link Result.$safePromise}, equivalent to
   * calling:
   *
   * ```ts
   * resultAsync.$orElse(() => Result.$safePromise(...))
   * ```
   */
  $orSafePromise<U = T>(
    this: ResultAsync<T, E>,
    promise: PromiseLike<U>,
  ): ResultAsync<T | U, Error>;
  $orSafePromise<U = T, F = E>(
    this: ResultAsync<T, E>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<T | U, F>;
  $orSafePromise<U, F>(
    this: ResultAsync<T, E>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<T | U, F | Error> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultOk) {
          return res;
        }

        try {
          return new ResultOk(await promise);
        } catch (err) {
          return new ResultErr(mapError(err));
        }
      }),
    );
  }

  /**
   * The same as {@link Retuple.$and|$and}, except it:
   *
   * - can also accept a `PromiseLike` and value;
   * - returns {@link ResultAsync}.
   */
  $and<U = T, F = E>(
    this: ResultAsync<T, E>,
    and: ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, E | F>;
  $and<U, F>(
    this: ResultAsync<T, E>,
    and: ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, E | F> {
    return new ResultAsync<U, E | F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? asResult(await and)
          : (res as ThisErr<E>);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$andThen|$andThen}, except it:
   *
   * - can also accept an `async` and function;
   * - returns {@link ResultAsync}.
   */
  $andThen<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, E | F>;
  $andThen<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, E | F> {
    return new ResultAsync<U, E | F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? asResult(await f(res[1]))
          : (res as ThisErr<E>);
      }),
    );
  }

  /**
   * @TODO
   */
  $andStack<U = T, F = E, S extends [...any[], any] = [...any[], any]>(
    this: ResultAsync<Stack<S>, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack<[...S, U]>, E | F>;
  $andStack<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack<[T, U]>, E | F>;
  $andStack<U, F>(
    this: ResultAsync<T, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack, any> {
    return new ResultAsync<Stack, E | F>(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        const resThen = asResult(await f(res[1] as T));

        if (resThen instanceof ResultErr) {
          return resThen as Result<Stack, F>;
        }

        if (res[1] instanceof RetupleStack) {
          return Ok(new RetupleStack(...res[1], resThen[1] as U) as Stack);
        }

        return Ok(new RetupleStack(res[1] as T, resThen[1] as U) as Stack);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$andThrough|$andThrough}, except it:
   *
   * - can also accept an `async` through function;
   * - returns {@link ResultAsync}.
   */
  $andThrough<F = E>(
    this: ResultAsync<T, E>,
    f: (val: T) => ResultLikeAwaitable<any, F>,
  ): ResultAsync<T, E | F>;
  $andThrough<F>(
    this: ResultAsync<T, E>,
    f: (val: T) => ResultLikeAwaitable<any, F>,
  ): ResultAsync<T, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultOk) {
          const through = asResult(await f(res[1]));

          if (through instanceof ResultErr) {
            return through;
          }
        }

        return res as ThisOk<T>;
      }),
    );
  }

  /**
   * The same as {@link Retuple.$andSafe|$andSafe}, except it:
   *
   * - can also accept an `async` safe function;
   * - returns {@link ResultAsync}.
   */
  $andSafe<U = T>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | PromiseLike<U>,
  ): ResultAsync<U, E | Error>;
  $andSafe<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<U, E | F>;
  $andSafe<U, F>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<U, E | F | Error> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        try {
          return Ok(await f(res[1] as T));
        } catch (err) {
          return Err(mapError(err));
        }
      }),
    );
  }

  /**
   * Returns {@link ResultAsync} based on the outcome of the promise when this
   * result is `Ok`.
   *
   * Otherwise, returns `Err` containing the current error value.
   *
   * Uses the same strategy as {@link Result.$safePromise}, equivalent to
   * calling:
   *
   * ```ts
   * resultAsync.$andThen(() => Result.$safePromise(...))
   * ```
   */
  $andSafePromise<U = T>(
    this: ResultAsync<T, E>,
    promise: PromiseLike<U>,
  ): ResultAsync<U, E | Error>;
  $andSafePromise<U = T, F = E>(
    this: ResultAsync<T, E>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<U, E | F>;
  $andSafePromise<U, F>(
    this: ResultAsync<T, E>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<U, E | F | Error> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        try {
          return Ok(await promise);
        } catch (err) {
          return Err(mapError(err));
        }
      }),
    );
  }

  /**
   * Execute a pipeline starting with the resolved `Ok` value of this result,
   * resolving to the `Ok` of the final function in the pipe or the first
   * `Err` encountered. If you only need to execute a single function, use
   * `$andThen`.
   *
   * Uses the same strategy as {@link Result.$pipeAsync}, equivalent to calling:
   *
   * ```ts
   * resultAsync.$andThen(
   *   (val) => Result.$pipeAsync(
   *     () => fn1(val),
   *     async (val2) => fn2(val2),
   *   ),
   * );
   * ```
   */
  $andPipe<T0, E0, T1, E1>(
    this: ResultAsync<T, E>,
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  ): ResultAsync<T1, E0 | E1>;
  $andPipe<T0, E0, T1, E1, T2, E2>(
    this: ResultAsync<T, E>,
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
  ): ResultAsync<T2, E0 | E1 | E2>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3>(
    this: ResultAsync<T, E>,
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
  ): ResultAsync<T3, E0 | E1 | E2 | E3>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4>(
    this: ResultAsync<T, E>,
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
  ): ResultAsync<T4, E0 | E1 | E2 | E3 | E4>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5>(
    this: ResultAsync<T, E>,
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
    f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
  ): ResultAsync<T5, E0 | E1 | E2 | E3 | E4 | E5>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6>(
    this: ResultAsync<T, E>,
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
    f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
    f6: (val5: T5) => ResultLikeAwaitable<T6, E6>,
  ): ResultAsync<T6, E0 | E1 | E2 | E3 | E4 | E5 | E6>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6, T7, E7>(
    this: ResultAsync<T, E>,
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
    f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
    f6: (val5: T5) => ResultLikeAwaitable<T6, E6>,
    f7: (val6: T6) => ResultLikeAwaitable<T7, E7>,
  ): ResultAsync<T7, E | E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7>;
  $andPipe(
    this: ResultAsync<T, E>,
    ...fx: ((val: any) => ResultLikeAwaitable<any, any>)[]
  ): ResultAsync<any, any> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        let current: any = res[1];

        for (const f of fx) {
          const result = asResult(await f(current));

          if (result instanceof ResultErr) {
            return result;
          }

          current = result[1];
        }

        return Ok(current);
      }),
    );
  }

  /**
   * The same as {@link Retuple.$peek|$peek}, except it:
   *
   * - awaits the peek function;
   * - returns {@link ResultAsync}.
   */
  $peek(
    this: ResultAsync<T, E>,
    f: (res: Result<T, E>) => any,
  ): ResultAsync<T, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        await f(res);

        return res;
      }),
    );
  }

  /**
   * The same as {@link Retuple.$tap|$tap}, except it:
   *
   * - awaits the tap function;
   * - returns {@link ResultAsync}.
   */
  $tap(this: ResultAsync<T, E>, f: (val: T) => any): ResultAsync<T, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultOk) {
          await f(res[1]);
        }

        return res;
      }),
    );
  }

  /**
   * The same as {@link Retuple.$tapErr|$tapErr}, except it:
   *
   * - awaits the tap error function;
   * - returns {@link ResultAsync}.
   */
  $tapErr(this: ResultAsync<T, E>, f: (err: E) => any): ResultAsync<T, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          await f(res[0]);
        }

        return res;
      }),
    );
  }

  /**
   * The same as {@link Retuple.$flatten|$flatten} except it returns
   * {@link ResultAsync}.
   */
  $flatten<U, F>(this: ResultAsync<Result<U, F>, E>): ResultAsync<U, E | F> {
    return new ResultAsync(this.#inner.then((res) => res.$flatten()));
  }

  /**
   * The same as {@link Retuple.$promise|$promise}.
   */
  $promise(this: ResultAsync<T, E>): Promise<Result<T, E>> {
    return Promise.resolve(this);
  }

  /**
   * The same as {@link Retuple.$iter|$iter}, except it returns a `Promise`.
   */
  async $iter<U>(
    this: ResultAsync<Iterable<U>, E>,
  ): Promise<IterableIterator<U, undefined, unknown>> {
    return (await this.#inner).$iter();
  }
}

/**
 * ## ResultRetry
 */
class ResultRetry<T, E>
  extends ResultAsync<T, E>
  implements PromiseLike<Result<T, E>>
{
  private static MAX_TIMEOUT = 3_600_000 as const;
  private static MAX_RETRY = 100 as const;

  private static zero(): 0 {
    return 0;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) =>
      setTimeout(resolve, Math.min(ms, ResultRetry.MAX_TIMEOUT)),
    );
  }

  private static integer(value: number): number {
    if (typeof value === "number" && Number.isInteger(value)) {
      return Math.max(0, value);
    }

    return 0;
  }

  #f: () => ResultLikeAwaitable<T, E>;
  #promise: Promise<Result<T, E>>;

  #times = 1;
  #attempt = 0;
  #aborted = false;
  #abort = () => (this.#aborted = true);

  #getDelay: (attempt: number) => number = ResultRetry.zero;
  #handler?: (controller: ResultRetryController<E>) => void | Promise<void>;

  constructor(f: () => ResultLikeAwaitable<T, E>) {
    super(Promise.resolve().then(() => this.#promise));

    this.#f = f;
    this.#promise = this.drain() as Promise<Result<T, E>>;
  }

  then<U = Result<T, E>, F = never>(
    this: ResultRetry<T, E>,
    onfulfilled?:
      | ((value: Result<T, E>) => U | PromiseLike<U>)
      | null
      | undefined,
    onrejected?: ((reason: any) => F | PromiseLike<F>) | null | undefined,
  ): PromiseLike<U | F> {
    return super.then(onfulfilled, onrejected);
  }

  /**
   * Sets the maximum number of times the retry function can be executed,
   * mutating this `ResultRetry` instance.
   *
   * **The default value is 1 - meaning that unless set, no retries will be
   * attempted.**
   *
   * The retry function can be called up to the maximum number of times until
   * it returns `Ok`. If it never returns `Ok`, the  most recent `Err` is
   * returned.
   *
   * This function accepts a positive integer between 1 and 100:
   *
   * - Integers outside of this range are clamped to the nearest valid value;
   * - Any other value (NaN, Infinity, fractions, strings) are treated as 1.
   *
   * @example
   *
   * ```ts
   * // Retry someResultFn up to 3 times until Ok is returned:
   * const result = await Result.$retry(someResultFn).$times(3);
   * ```
   */
  $times<N extends number>(
    this: ResultRetry<T, E>,
    times: NonZero<N> & NonNegativeOrDecimal<N>,
  ): ResultRetry<T, E> {
    this.#times = Math.min(
      Math.max(1, ResultRetry.integer(times)),
      ResultRetry.MAX_RETRY,
    );

    return this;
  }

  /**
   * Sets the delay between each retry attempt, mutating this `ResultRetry`
   * instance.
   *
   * - Provide a number of milliseconds to introduce a static delay between
   *   attempts;
   * - Provide a function to compute the delay dynamically for each attempt;
   * - If the maximum number of retries is 1, this setting as no effect.
   *
   * **The default value is 0 - meaning that unless set, there will be no delay
   * between attempts.**
   *
   * This function accepts an integer between 0 and 3600000:
   *
   * - Integers outside of this range are clamped to the nearest valid value;
   * - Any other value (NaN, Infinity, fractions, strings) are treated as 0.
   *
   * @example
   *
   * ```ts
   * // Retry someResultFn up to 3 times until Ok is returned,
   * // with a 1 second delay between each invocation:
   * const result = await Result.$retry(someResultFn).$times(3).$delay(1000);
   * ```
   */
  $delay<N extends number>(
    this: ResultRetry<T, E>,
    f: (attempt: number) => NonNegativeOrDecimal<N>,
  ): ResultRetry<T, E>;
  $delay<N extends number>(
    this: ResultRetry<T, E>,
    ms: NonNegativeOrDecimal<N>,
  ): ResultRetry<T, E>;
  $delay(
    this: ResultRetry<T, E>,
    fnOrMs: number | ((attempt: number) => number),
  ): ResultRetry<T, E> {
    if (typeof fnOrMs === "function") {
      this.#getDelay = fnOrMs;

      return this;
    }

    const delay = ResultRetry.integer(fnOrMs);

    if (delay > 0) {
      this.#getDelay = () => delay;
    }

    return this;
  }

  /**
   * Sets a handler to be called when an attempt returns `Err`, mutating this
   * `ResultRetry` instance. The handler can be used to capture information
   * about each failure, and to abort early and prevent further retries.
   *
   * The handler function is called with `ResultRetryHandleState`, containing:
   *
   * - **error** - The error value from the last failed attempt;
   * - **attempt** - The attempt number;
   * - **abort** - A function which when called, prevents further retries.
   *
   * @example
   *
   * ```ts
   * // Retry someResultFn up to 3 times until Ok is returned, logging each
   * // attempt and aborting early if the error code is "UNAUTHORIZED".
   * const result = await Result.$retry(someResultFn)
   *    .$times(3)
   *    .$handle(({ error, attempt, abort }) => {
   *       console.info(`Attempt ${attempt} failed: ${error}`);
   *       if (error === "UNAUTHORIZED") {
   *          abort();
   *       }
   *    });
   * ```
   */
  $handle(
    f: (controller: ResultRetryController<E>) => void,
  ): ResultRetry<T, E> {
    this.#handler = f;

    return this;
  }

  private async drain(this: ResultRetry<T, E>): Promise<Result<T, E>> {
    while (this.#attempt < this.#times) {
      const result = asResult(await this.#f());

      this.#attempt++;

      if (result.$isOk()) {
        return result;
      }

      if (this.#handler) {
        await this.#handler({
          error: result[0] as E,
          attempt: this.#attempt,
          abort: this.#abort,
        });
      }

      if (this.#aborted || this.#attempt >= this.#times) {
        return result;
      }

      const delay = ResultRetry.integer(this.#getDelay(this.#attempt));

      if (delay > 0) {
        await ResultRetry.delay(delay);
      }
    }

    /* v8 ignore next */
    throw new Error("Retuple: Unreachable code executed");
  }
}

type Stack<T extends [...any[], any] = [...any[], any]> = T & {
  [RetupleStackSymbol]: T;
};

class RetupleStack<T extends any[]> extends Array<T[number]> {
  declare [RetupleStackSymbol]: T;
}

function asResult<T, E>(resultLike: ResultLike<T, E>): Result<T, E> {
  if (resultLike instanceof ResultOk || resultLike instanceof ResultErr) {
    return resultLike;
  }

  const result = resultLike[ResultLikeSymbol]();

  return result.ok ? new ResultOk(result.value) : new ResultErr(result.value);
}

function ensureError<E = Error>(err: unknown): E {
  if (err instanceof Error) {
    return err as E;
  }

  return new RetupleCaughtValueError(err) as E;
}

function mapTrue<E>(): E {
  return true as E;
}

interface Retuple<T, E> extends ResultLike<T, E> {
  /**
   * Returns true when this result is `Ok`. Acts as a type guard.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$isOk(), true);
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$isOk(), false);
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, Error> = someResultFn();
   *
   * if (result.$isOk()) {
   *    result satisfies Result<string, never>;
   * }
   * ```
   */
  $isOk(this: Result<T, E>): this is Result<T, never>;

  /**
   * Returns true when this result is `Ok`, and when the predicate/condition
   * function returns true. Acts as a type guard.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$isOkAnd((val) => val === "test"), true);
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok<string>("test");
   * assert.equal(result.$isOkAnd((val) => val !== "test"), false);
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$isOkAnd((err) => err === "test"), false);
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string | number, Error> = someResultFn();
   *
   * if (result.$isOkAnd((val): val is number => typeof val === "number")) {
   *    result satisfies Result<number, never>;
   * }
   * ```
   */
  $isOkAnd<U extends T = T>(
    this: Result<T, E>,
    predicate: (val: T) => val is U,
  ): this is Result<U, never>;
  $isOkAnd(
    this: Result<T, E>,
    predicate: (val: T) => unknown,
  ): this is Result<T, never>;

  /**
   * Returns true when this result is `Err`. Acts as a type guard.
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$isErr(), true);
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$isErr(), false);
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, Error> = someResultFn();
   *
   * if (result.$isErr()) {
   *    result satisfies Result<never, Error>;
   * }
   * ```
   */
  $isErr(this: Result<T, E>): this is Result<never, E>;

  /**
   * Returns true when this result is `Err`, and when the predicate/condition
   * function returns true. Acts as a type guard.
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$isErrAnd((err) => err === "test"), true);
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err<string>("test");
   * assert.equal(result.$isErrAnd((err) => err !== "test"), false);
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$isErrAnd((val) => val === "test"), false);
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, Error | number> = someResultFn();
   *
   * if (result.$isErrAnd((err): err is number => typeof err === "number")) {
   *    result satisfies Result<never, number>;
   * }
   * ```
   */
  $isErrAnd<F extends E = E>(
    this: Result<T, E>,
    prediacte: (val: E) => val is F,
  ): this is Result<never, F>;
  $isErrAnd(
    this: Result<T, E>,
    predicate: (val: E) => unknown,
  ): this is Result<never, E>;

  /**
   * Returns the ok value when this result is `Ok`.
   *
   * Otherwise, the error value is thrown.
   *
   * This method should only be called when the `E` type extends `Error`. This
   * is enforced with a type constraint. If the error value is not an instance
   * of Error, `RetupleExpectFailed` is thrown. Use
   * {@link Retuple.$unwrap|$unwrap} When the `E` type does not extend Error.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$expect(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const error = new Error("test");
   * const result = Err(error);
   *
   * try {
   *   const value = result.$expect(); // throws
   * } catch (e) {
   *   assert.equal(e, error);
   * }
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   *
   * try {
   *   // This is a type error - the E type does not extend Error
   *   const value = result.$expect(); // throws
   * } catch (e) {
   *   assert(e instanceof RetupleExpectFailed && e.value === "test");
   * }
   * ```
   */
  $expect(this: Result<T, Error>): T;

  /**
   * Returns the ok value when this result is `Ok`.
   *
   * Otherwise, `RetupleUnwrapFailed` is thrown. A custom error message can be
   * provided.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$unwrap(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   *
   * try {
   *   const value = result.$unwrap(); // throws
   * } catch (e) {
   *   assert(e instanceof RetupleUnwrapFailed && e.value === "test");
   * }
   * ```
   *
   * @example
   *
   * ```ts
   * const error = new Error("test");
   * const result = Err(error);
   *
   * try {
   *   const value = result.$unwrap("error-message"); // throws
   * } catch (e) {
   *   assert(
   *      e instanceof RetupleUnwrapFailed &&
   *      e.message === "error-message" &&
   *      e.value === error &&
   *      e.cause === error, // set when error value was an instance of `Error`
   *   );
   * }
   * ```
   */
  $unwrap(this: Result<T, E>, msg?: string): T;

  /**
   * Returns the error value when this result is `Err`.
   *
   * Otherwise, `RetupleUnwrapErrFailed` is thrown. A custom error message can
   * be provided.
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$unwrapErr(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   *
   * try {
   *   const value = result.$unwrapErr(); // throws
   * } catch (e) {
   *   assert(e instanceof RetupleUnwrapErrFailed && e.value === "test");
   * }
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   *
   * try {
   *   const value = result.$unwrapErr("error-message"); // throws
   * } catch (e) {
   *   assert(
   *      e instanceof RetupleUnwrapErrFailed &&
   *      e.message === "error-message" &&
   *      e.value === "test",
   *   );
   * }
   * ```
   */
  $unwrapErr(this: Result<T, E>, msg?: string): E;

  /**
   * Returns the ok value when this result is `Ok`.
   *
   * Otherwise, returns the default value.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$unwrapOr("default"), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$unwrapOr("default"), "default");
   * ```
   */
  $unwrapOr<const U = T>(this: Result<T, E>, def: U): T | U;

  /**
   * Returns the ok value when this result is `Ok`.
   *
   * Otherwise, returns the value returned by the default function.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(result.$unwrapOrElse(() => "default"), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$unwrapOrElse(() => "default"), "default");
   * ```
   */
  $unwrapOrElse<U = T>(this: Result<T, E>, f: () => U): T | U;

  /**
   * Performs an assertion when this result is `Ok`:
   *
   * - returning `Ok` containing the current ok value when it is truthy.
   *   Narrows the `T` type to include only truthy values;
   * - returning `Err` containing the return value of the map error function
   *   when the ok value is falsey;
   * - returning `Err` containing {@link RetupleAssertFailed} when the
   *   ok value is falsey, and when no map error function is provided.
   *
   * Otherwise returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result: Result<string | null, never> = Ok("test");
   * const asserted = result.$assert();
   *
   * asserted satisfies Result<string, RetupleCheckFailedError<string | null>>;
   * assert.equal(asserted.$unwrap(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string | null | undefined, never> = Ok(null);
   * const asserted = result.$assert(
   *   (val) => val === null ? "value was null" : "value was undefined"
   * );
   *
   * asserted satisfies Result<string, string>;
   * assert.equal(asserted.$unwrapErr(), "value was null");
   * ```
   */
  $assert(this: Result<T, E>): Result<Truthy<T>, E | RetupleFilterFailed<T>>;
  $assert<F = E>(
    this: Result<T, E>,
    mapError: (val: Falsey<T>) => F,
  ): Result<Truthy<T>, E | F>;

  /**
   * Performs a check when this result is `Ok`:
   *
   * - returning `Ok` containing the current ok value when the filter function
   *   returns true. Narrows the `T` type based on the filter function;
   * - returning `Err` containing the return value of the map error function
   *   when the ok value fails the filter;
   * - returning `Err` containing {@link RetupleFilterFailed} when the
   *   ok value fails the filter, and when no map error function is provided.
   *
   * Otherwise returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result: Result<string, never> = Ok("test");
   * const asserted = result.$filter((val) => val === "test");
   *
   * asserted satisfies Result<string, RetupleCheckFailedError<string>>;
   * assert.equal(asserted.$unwrap(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, never> = Ok("test");
   * const checked = result.$filter(
   *   (val) => val === "value",
   *   (val) => `value was ${val}`,
   * );
   *
   * checked satisfies Result<"value", string>;
   * assert.equal(checked.$unwrapErr(), "value was test");
   * ```
   */
  $filter<U extends T = T>(
    this: Result<T, E>,
    predicate: (val: T) => val is U,
  ): Result<U, E | RetupleFilterFailed<T>>;
  $filter(
    this: Result<T, E>,
    filter: (val: T) => unknown,
  ): Result<T, E | RetupleFilterFailed<T>>;
  $filter<U extends T = T, F = E>(
    this: Result<T, E>,
    predicate: (val: T) => val is U,
    mapError: (val: T) => F,
  ): Result<U, E | F>;
  $filter<F = E>(
    this: Result<T, E>,
    filter: (val: T) => unknown,
    mapError: (val: T) => F,
  ): Result<T, E | F>;

  /**
   * Checks the specified element of the contained array when when this result
   * is `Ok`:
   *
   * - returning `Ok` containing the specified element when it is truthy.
   *   Narrows the type to include only truthy values;
   * - returning `Err` containing the return value of the map error function
   *   when the specified array element fails the check;
   * - returning `Err` containing {@link RetupleIndexFailed} when the specified
   *   array element fails the check, and when no map error function is
   *   provided.
   *
   * Otherwise returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result: Result<(string | null)[], never> = Ok([null, "test"]);
   * const first = result.$atIndex(1);
   *
   * first satisfies Result<string, RetupleCheckFailedError<string | null>>;
   * assert.equal(first.$unwrap(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<(string | null | undefined)[], never> = Ok(["test", null]);
   * const first = result.$atIndex(
   *   1,
   *   (val) => val === null ? "value was null" : "value was undefined",
   * );
   *
   * first satisfies Result<string, string>;
   * assert.equal(first.$unwrapErr(), "value was null");
   * ```
   */
  $atIndex<U>(
    this: Result<readonly U[], E>,
    index: number,
  ): Result<Truthy<U>, E | RetupleIndexFailed<T>>;
  $atIndex<U, F = E>(
    this: Result<readonly U[], E>,
    index: number,
    mapError: (val: T) => F,
  ): Result<Truthy<U>, E | F>;

  /**
   * Equivalent to calling `result.$atIndex(0)`.
   */
  $firstIndex<U>(
    this: Result<readonly U[], E>,
  ): Result<Truthy<U>, E | RetupleFilterFailed<T>>;
  $firstIndex<U, F = E>(
    this: Result<readonly U[], E>,
    mapError: (val: T) => F,
  ): Result<Truthy<U>, E | F>;

  /**
   * Returns `Ok` containing the return value of the map function when this
   * result is `Ok`.
   *
   * Otherwise, returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$map((val) => `map:${val}`).$unwrap(),
   *    "map:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Err("test");
   * assert.equal(
   *    result.$map((val) => `map:${val}`).$unwrapErr(),
   *    "test",
   * );
   * ```
   */
  $map<U>(this: Result<T, E>, f: (val: T) => U): Result<U, E>;

  /**
   * Returns `Err` containing the return value of the map error function
   * when this result is `Err`.
   *
   * Otherwise, returns `Ok` containing the current ok value.
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(
   *    result.$mapErr((err) => `map-err:${err}`).$unwrapErr(),
   *    "map-err:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Ok("test");
   * assert.equal(
   *    result.$mapErr((err) => `map-err:${err}`).$unwrap(),
   *    "test",
   * );
   * ```
   */
  $mapErr<F = E>(this: Result<T, E>, f: (err: E) => F): Result<T, F>;

  /**
   * Returns `Ok` containing the return value of the map function when this
   * result is `Ok`.
   *
   * Otherwise, returns `Ok` containing the default value.
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Ok("test");
   * assert.equal(
   *    result.$mapOr("default", (val) => `map:${val}`).$unwrap(),
   *    "map:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Err("test");
   * assert.equal(
   *    result.$mapOr("default", (val) => `map:${val}`).$unwrap(),
   *    "default",
   * );
   * ```
   */
  $mapOr<U, V = U>(
    this: Result<T, E>,
    def: U,
    f: (val: T) => V,
  ): Result<U | V, never>;

  /**
   * Returns `Ok` containing the return value of the map function when this
   * result is `Ok`.
   *
   * Otherwise, returns `Ok` containing the return value of the default
   * function.
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Ok("test");
   * assert.equal(
   *    result.$mapOrElse(
   *       (err) => `default:${err}`,
   *       (val) => `map:${val}`,
   *    ).$unwrap(),
   *    "map:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Err("test");
   * assert.equal(
   *    result.$mapOrElse(
   *       (err) => `default:${err}`,
   *       (val) => `map:${val}`,
   *    ).$unwrap(),
   *    "default:test",
   * );
   * ```
   */
  $mapOrElse<U, V = U>(
    this: Result<T, E>,
    def: (err: E) => U,
    f: (val: T) => V,
  ): Result<U | V, never>;

  /**
   * Returns the or result, when this result is `Err`.
   *
   * Otherwise, returns `Ok` containing the current ok value.
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(
   *    result.$or(Ok("or-ok")).$unwrap(),
   *    "or-ok",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(
   *    result.$or(Err("or-err")).$unwrapErr(),
   *    "or-err",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$or(Ok("or-ok")).$unwrap(),
   *    "test",
   * );
   * ```
   */
  $or<U = T, F = E>(this: Result<T, E>, or: ResultLike<U, F>): Result<T | U, F>;

  /**
   * Shorthand for `result.$async().$or(...)`
   */
  $orAsync<U = T, F = E>(
    this: Result<T, E>,
    or: ResultLikeAwaitable<U, F>,
  ): ResultAsync<T | U, F>;

  /**
   * Returns the result returned by the or function, when this result is `Err`.
   *
   * Otherwise, returns `Ok` containing the current ok value.
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(
   *    result.$orElse((err) => Ok(`or-ok:${err}`)).$unwrap(),
   *    "or-ok:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(
   *    result.$orElse((err) => Err(`or-err:${err}`)).$unwrapErr(),
   *    "or-err:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Ok("test");
   * assert.equal(
   *    result.$orElse((err) => Ok(`or-ok:${err}`)).$unwrap(),
   *    "test",
   * );
   * ```
   */
  $orElse<U = T, F = E>(
    this: Result<T, E>,
    f: (err: E) => ResultLike<U, F>,
  ): Result<T | U, F>;

  /**
   * Shorthand for `result.$async().$orElse(...)`
   */
  $orElseAsync<U = T, F = E>(
    this: Result<T, E>,
    f: (err: E) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<T | U, F>;

  /**
   * Returns a {@link Result} based on the outcome of the safe function when
   * this result is `Err`.
   *
   * Otherwise, returns `Ok` containing the current ok value.
   *
   * Uses the same strategy as {@link Result.$safe}, equivalent to calling
   * `result.$or(Result.$safe(...))`.
   */
  $orSafe<U = T>(this: Result<T, E>, f: (err: E) => U): Result<T | U, Error>;
  $orSafe<U = T, F = E>(
    this: Result<T, E>,
    f: (err: E) => U,
    mapError: (err: unknown) => F,
  ): Result<T | U, F>;

  /**
   * Shorthand for `result.$async().$orSafe(...)`
   */
  $orSafeAsync<U = T>(
    this: Result<T, E>,
    f: (err: E) => U | PromiseLike<U>,
  ): ResultAsync<T | U, Error>;
  $orSafeAsync<U = T, F = E>(
    this: Result<T, E>,
    f: (err: E) => U | PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<T | U, F>;

  /**
   * Shorthand for `result.$async().$orSafePromise(...)`
   */
  $orSafePromise<U = T>(
    this: Result<T, E>,
    promise: PromiseLike<U>,
  ): ResultAsync<T | U, Error>;
  $orSafePromise<U = T, F = E>(
    this: Result<T, E>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<T | U, F>;

  /**
   * Returns the and result, when this result is `Ok`.
   *
   * Otherwise, returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$and(Ok("and-ok")).$unwrap(),
   *    "and-ok",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$and(Err("and-err")).$unwrapErr(),
   *    "and-err",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(
   *    result.$and(Ok("and-ok")).$unwrapErr(),
   *    "test",
   * );
   * ```
   */
  $and<U = T, F = E>(
    this: Result<T, E>,
    and: ResultLike<U, F>,
  ): Result<U, E | F>;

  /**
   * Shorthand for `result.$async().$and(...)`
   */
  $andAsync<U = T, F = E>(
    this: Result<T, E>,
    and: ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, E | F>;

  /**
   * Returns the and result, when this result is `Ok`.
   *
   * Otherwise, returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$and((val) => Ok(`and-ok:${val}`)).$unwrap(),
   *    "and-ok:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$and((val) => Err(`and-err:${val}`)).$unwrapErr(),
   *    "and-err:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Err("test");
   * assert.equal(
   *    result.$and((val) => Ok(`and-ok:${val}`)).$unwrapErr(),
   *    "test",
   * );
   * ```
   */
  $andThen<U = T, F = E>(
    this: Result<T, E>,
    f: (val: T) => ResultLike<U, F>,
  ): Result<U, E | F>;

  /**
   * @TODO
   */
  $andStack<U = T, F = E, S extends [...any[], any] = [...any[], any]>(
    this: Result<Stack<S>, E>,
    f: (val: T) => ResultLike<U, F>,
  ): Result<Stack<[...S, U]>, E | F>;
  $andStack<U = T, F = E>(
    this: Result<T, E>,
    f: (val: T) => ResultLike<U, F>,
  ): Result<Stack<[T, U]>, E | F>;

  /**
   * Shorthand for `result.$async().$andThen(...)`
   */
  $andThenAsync<U = T, F = E>(
    this: Result<T, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<U, E | F>;

  /**
   * @TODO
   */
  $andStackAsync<U = T, F = E, S extends [...any[], any] = [...any[], any]>(
    this: Result<Stack<S>, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack<[...S, U]>, E | F>;
  $andStackAsync<U = T, F = E>(
    this: Result<T, E>,
    f: (val: T) => ResultLikeAwaitable<U, F>,
  ): ResultAsync<Stack<[T, U]>, E | F>;

  /**
   * Calls the through function when this result is `Ok` and returns:
   *
   * - `Ok` containing the original ok value when the through function
   *   returns `Ok`;
   * - the `Err` returned by the through function when it returns `Err`.
   *
   * Otherwise, returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$andThrough((val) => Ok(`ok-through:${val}`)).$unwrap(),
   *    "test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result.$andThrough((val) => Err(`err-through:${val}`)).$unwrapErr(),
   *    "err-through:test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Err("test");
   * assert.equal(
   *    result.$andThrough((val) => Ok(`ok-through:${val}`)).$unwrapErr(),
   *    "test",
   * );
   * ```
   */
  $andThrough<F = E>(
    this: Result<T, E>,
    f: (val: T) => ResultLike<any, F>,
  ): Result<T, E | F>;

  /**
   * Shorthand for `result.$async().$andThrough(...)`
   */
  $andThroughAsync<F = E>(
    this: Result<T, E>,
    f: (val: T) => ResultLikeAwaitable<any, F>,
  ): ResultAsync<T, E | F>;

  /**
   * Returns a result based on the outcome of the safe function when this
   * result is `Ok`.
   *
   * Otherwise, returns `Err` containing the current error value.
   *
   * Uses the same strategy as {@link Result.$safe}, equivalent to calling:
   *
   * ```ts
   * result.$andThen(() => Result.$safe(...))
   * ```
   */
  $andSafe<U = T>(this: Result<T, E>, f: (val: T) => U): Result<U, E | Error>;
  $andSafe<U = T, F = E>(
    this: Result<T, E>,
    f: (val: T) => U,
    mapError: (err: unknown) => F,
  ): Result<U, E | F>;

  /**
   * Shorthand for `result.$async().$andSafe(...)`
   */
  $andSafeAsync<U = T>(
    this: Result<T, E>,
    f: (val: T) => U | PromiseLike<U>,
  ): ResultAsync<U, E | Error>;
  $andSafeAsync<U = T, F = E>(
    this: Result<T, E>,
    f: (val: T) => U | PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<U, E | F>;

  /**
   * Shorthand for `result.$async().$andSafePromise(...)`
   */
  $andSafePromise<U = T>(
    this: Result<T, E>,
    promise: PromiseLike<U>,
  ): ResultAsync<U, E | Error>;
  $andSafePromise<U = T, F = E>(
    this: Result<T, E>,
    promise: PromiseLike<U>,
    mapError: (err: unknown) => F,
  ): ResultAsync<U, E | F>;

  /**
   * Execute a pipeline starting with the `Ok` value of this result, returning
   * the `Ok` of the final function in the pipe or the first `Err` encountered.
   * If you only need to execute a single function, use `$andThen`
   *
   * Uses the same strategy as {@link Result.$pipe}, equivalent to calling:
   *
   * ```ts
   * result.$andThen(
   *   (val) => Result.$pipe(
   *     () => fn1(val),
   *     (val2) => fn2(val2),
   *   ),
   * );
   * ```
   */
  $andPipe<T0, E0, T1, E1>(
    this: ResultLike<T, E>,
    f0: (val: T) => ResultLike<T0, E0>,
    f1: (val: T0) => ResultLike<T1, E1>,
  ): Result<T1, E | E0 | E1>;
  $andPipe<T0, E0, T1, E1, T2, E2>(
    f0: (val: T) => ResultLike<T0, E0>,
    f1: (val0: T0) => ResultLike<T1, E1>,
    f2: (val1: T1) => ResultLike<T2, E2>,
  ): Result<T2, E | E0 | E1 | E2>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3>(
    f0: (val: T) => ResultLike<T0, E0>,
    f1: (val0: T0) => ResultLike<T1, E1>,
    f2: (val1: T1) => ResultLike<T2, E2>,
    f3: (val2: T2) => ResultLike<T3, E3>,
  ): Result<T3, E | E0 | E1 | E2 | E3>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4>(
    f0: (val: T) => ResultLike<T0, E0>,
    f1: (val0: T0) => ResultLike<T1, E1>,
    f2: (val1: T1) => ResultLike<T2, E2>,
    f3: (val2: T2) => ResultLike<T3, E3>,
    f4: (val3: T3) => ResultLike<T4, E4>,
  ): Result<T4, E | E0 | E1 | E2 | E3 | E4>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5>(
    f0: (val: T) => ResultLike<T0, E0>,
    f1: (val0: T0) => ResultLike<T1, E1>,
    f2: (val1: T1) => ResultLike<T2, E2>,
    f3: (val2: T2) => ResultLike<T3, E3>,
    f4: (val3: T3) => ResultLike<T4, E4>,
    f5: (val4: T4) => ResultLike<T5, E5>,
  ): Result<T5, E | E0 | E1 | E2 | E3 | E4 | E5>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6>(
    f0: (val: T) => ResultLike<T0, E0>,
    f1: (val0: T0) => ResultLike<T1, E1>,
    f2: (val1: T1) => ResultLike<T2, E2>,
    f3: (val2: T2) => ResultLike<T3, E3>,
    f4: (val3: T3) => ResultLike<T4, E4>,
    f5: (val4: T4) => ResultLike<T5, E5>,
    f6: (val5: T5) => ResultLike<T6, E6>,
  ): Result<T6, E | E0 | E1 | E2 | E3 | E4 | E5 | E6>;
  $andPipe<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6, T7, E7>(
    f0: (val: T) => ResultLike<T0, E0>,
    f1: (val0: T0) => ResultLike<T1, E1>,
    f2: (val1: T1) => ResultLike<T2, E2>,
    f3: (val2: T2) => ResultLike<T3, E3>,
    f4: (val3: T3) => ResultLike<T4, E4>,
    f5: (val4: T4) => ResultLike<T5, E5>,
    f6: (val5: T5) => ResultLike<T6, E6>,
    f7: (val6: T6) => ResultLike<T7, E7>,
  ): Result<T7, E | E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7>;

  /**
   * Shorthand for `result.$async().$andPipe(...)`
   *
   * If you only need to execute a single function, use `$andThenAsync`
   */
  $andPipeAsync<T0, E0, T1, E1>(
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
  ): ResultAsync<T1, E0 | E1>;
  $andPipeAsync<T0, E0, T1, E1, T2, E2>(
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
  ): ResultAsync<T2, E0 | E1 | E2>;
  $andPipeAsync<T0, E0, T1, E1, T2, E2, T3, E3>(
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
  ): ResultAsync<T3, E0 | E1 | E2 | E3>;
  $andPipeAsync<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4>(
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
  ): ResultAsync<T4, E0 | E1 | E2 | E3 | E4>;
  $andPipeAsync<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5>(
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
    f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
  ): ResultAsync<T5, E0 | E1 | E2 | E3 | E4 | E5>;
  $andPipeAsync<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6>(
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
    f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
    f6: (val5: T5) => ResultLikeAwaitable<T6, E6>,
  ): ResultAsync<T6, E0 | E1 | E2 | E3 | E4 | E5 | E6>;
  $andPipeAsync<T0, E0, T1, E1, T2, E2, T3, E3, T4, E4, T5, E5, T6, E6, T7, E7>(
    f0: (val: T) => ResultLikeAwaitable<T0, E0>,
    f1: (val0: T0) => ResultLikeAwaitable<T1, E1>,
    f2: (val1: T1) => ResultLikeAwaitable<T2, E2>,
    f3: (val2: T2) => ResultLikeAwaitable<T3, E3>,
    f4: (val3: T3) => ResultLikeAwaitable<T4, E4>,
    f5: (val4: T4) => ResultLikeAwaitable<T5, E5>,
    f6: (val5: T5) => ResultLikeAwaitable<T6, E6>,
    f7: (val6: T6) => ResultLikeAwaitable<T7, E7>,
  ): ResultAsync<T7, E | E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7>;

  /**
   * Calls the peek function and returns {@link Result} equivalent to this
   * result.
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Ok("test");
   * assert.equal(
   *    result
   *       .$peek((res) => {
   *          const [err, value] = res;
   *
   *          console.log("Err:", err); // Err: undefined
   *          console.log("Value:", value); // Value: test
   *       })
   *       .$unwrap(),
   *    "test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Result<string, string> = Err("test");
   * assert.equal(
   *    result
   *       .$peek((res) => {
   *          const [err, value] = res;
   *
   *          console.log("Err:", err); // Err: test
   *          console.log("Value:", value); // Value: undefined
   *       })
   *       .$unwrapErr(),
   *    "test",
   * );
   * ```
   */
  $peek(this: Result<T, E>, f: (res: Result<T, E>) => void): Result<T, E>;

  /**
   * Calls the tap function when this result is `Ok`, and returns `Ok`
   * containing the current ok value.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test");
   * assert.equal(
   *    result
   *       .$tap((val) => console.log("Value:", val)) // Value: test
   *       .$unwrap(),
   *    "test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Record<string, string> = Err("test");
   * assert.equal(
   *    result
   *       .$tap((val) => console.log("Value:", val)) // not executed
   *       .$unwrapErr(),
   *    "test",
   * );
   * ```
   */
  $tap(this: Result<T, E>, f: (val: T) => any): Result<T, E>;

  /**
   * Calls the tap error function when this result is `Err`, and returns `Err`
   * containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(
   *    result
   *       .$tapErr((err) => console.log("Err:", err)) // Err: test
   *       .$unwrapErr(),
   *    "test",
   * );
   * ```
   *
   * @example
   *
   * ```ts
   * const result: Record<string, string> = Ok("test");
   * assert.equal(
   *    result
   *       .$tapErr((err) => console.log("Err:", err)) // not executed
   *       .$unwrap(),
   *    "test",
   * );
   * ```
   */
  $tapErr(this: Result<T, E>, f: (err: E) => void): Result<T, E>;

  /**
   * Returns the contained {@link Result} when this result is `Ok`.
   *
   * Otherwise returns `Err` containing the current error value.
   *
   * @example
   *
   * ```ts
   * const result = Ok(Ok("test"));
   * assert.equal(result.$flatten().$unwrap(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok(Err("test"));
   * assert.equal(result.$flatten().$unwrapErr(), "test");
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test");
   * assert.equal(result.$flatten().$unwrapErr(), "test");
   * ```
   */
  $flatten<U, F>(this: Result<Result<U, F>, E>): Result<U, E | F>;

  /**
   * Returns an equivalent {@link ResultAsync}.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test").$async();
   * assert.equal(await result.$unwrap(), "test");
   * ```
   * @example
   *
   * ```ts
   * const result = Err("test").$async();
   * assert.equal(await result.$unwrapErr(), "test");
   * ```
   */
  $async(this: Result<T, E>): ResultAsync<T, E>;

  /**
   * Returns a `Promise` which resolves to this result.
   *
   * @example
   *
   * ```ts
   * const result = Ok("test").$promise();
   * assert.equal(await result, result);
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err("test").$promise();
   * assert.equal(await result, result);
   * ```
   */
  $promise(this: Result<T, E>): Promise<Result<T, E>>;

  /**
   * Returns an `IterableIterator` over the contained ok value, when this
   * result is `Ok`.
   *
   * Otherwise, returns an empty `IterableIterator`.
   *
   * This method should only be called when the `T` type is `Iterable`. This
   * is enforced with a type constraint. If the ok value is not iterable,
   * attempting to iterate over it will throw the built-in error.
   *
   * @example
   *
   * ```ts
   * const result = Ok([1, 2, 3]);
   *
   * for (const n of result.$iter()) {
   *    console.log(n); // 1.. 2.. 3
   * }
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Err([1, 2, 3]);
   *
   * for (const n of result.$iter()) {
   *    console.log(n); // not executed, iterator is empty
   * }
   * ```
   *
   * @example
   *
   * ```ts
   * const result = Ok<any>(1);
   *
   * try {
   *    for (const n of result.$iter()) {}
   * } catch (err) {
   *    // err is 'TypeError: number 1 is not iterable' in V8
   * }
   * ```
   */
  $iter<U>(
    this: Result<Iterable<U>, E>,
  ): IterableIterator<U, undefined, unknown>;
}

type OkTuple<T> = [err: undefined, value: T];
type ErrTuple<E> = [err: E, value: undefined];

type ThisOk<T> = OkTuple<T> & Retuple<T, never>;
type ThisErr<E> = ErrTuple<E> & Retuple<never, E>;

type ResultLikeAwaitable<T, E> =
  | ResultLike<T, E>
  | PromiseLike<ResultLike<T, E>>;

type ObjectUnionOk<T> = { success: true; data: T; error?: never | undefined };
type ObjectUnionErr<E> = { success: false; data?: never | undefined; error: E };

type AllOk<TResults extends ResultLikeAwaitable<any, any>[]> = {
  [K in keyof TResults]: TResults[K] extends ResultLikeAwaitable<infer T, any>
    ? T
    : never;
};

type AllErr<TResults extends ResultLikeAwaitable<any, any>[]> =
  TResults[number] extends ResultLikeAwaitable<any, infer E> ? E : never;

type AnyOk<TResult extends ResultLikeAwaitable<any, any>[]> =
  TResult[number] extends ResultLikeAwaitable<infer T, any> ? T : never;

type AnyErr<TResults extends ResultLikeAwaitable<any, any>[]> = {
  [K in keyof TResults]: TResults[K] extends ResultLikeAwaitable<any, infer E>
    ? E
    : never;
};

type CollectOk<TResults extends Record<string, ResultLikeAwaitable<any, any>>> =
  {
    [K in keyof TResults]: TResults[K] extends ResultLikeAwaitable<infer T, any>
      ? T
      : never;
  } & {};

type CollectErr<
  TResults extends Record<string, ResultLikeAwaitable<any, any>>,
> =
  TResults[keyof TResults] extends ResultLikeAwaitable<any, infer E>
    ? E
    : never;

type Truthy<T> = Exclude<T, false | null | undefined | 0 | 0n | "">;
type Falsey<T> = Extract<T, false | null | undefined | 0 | 0n | "">;
type NonZero<N extends number> = N & (`${N}` extends "0" ? never : N);
type NonNegativeOrDecimal<N extends number> = N &
  (`${N}` extends `-${string}` | `${string}.${string}` ? never : N);
