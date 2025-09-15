export type nonNullable = typeof nonNullable;
export type truthy = typeof truthy;
export type safe = typeof safe;
export type safeAsync = typeof safeAsync;
export type safePromise = typeof safePromise;

export type Ok<T> = OkTuple<T> & Retuple<T, never>;
export type Err<E> = ErrTuple<E> & Retuple<never, E>;
export type Result<T, E> = (OkTuple<T> | ErrTuple<E>) & Retuple<T, E>;

export { type ResultAsync };

/**
 * ## Retuple Unwrap Failed
 *
 * An error which occurs when calling `$unwrap` on `Err`.
 */
export class RetupleUnwrapFailed<const E = unknown> extends Error {
  constructor(
    public value: E,
    msg = "Unwrap failed"
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
    msg = "Unwrap error failed"
  ) {
    super(msg);
  }
}

/**
 * ## Retuple Expect Failed
 *
 * An error which occurs when calling `$expect` on `Err`, and when the value
 * contained in the `Err` is not an instance of `Error`.
 */
export class RetupleExpectFailed<const E = unknown> extends Error {
  constructor(public value: E) {
    super("Expect failed");
  }
}

/**
 * ## Retuple Thrown Value Error
 *
 * An error constructed when a safe function call throws or rejects, when the
 * thrown error or rejected value is not an instance of `Error`, and when no
 * map error function is provided.
 */
export class RetupleThrownValueError extends Error {
  constructor(public value: unknown) {
    super("Caught value was not an instance of Error");
  }
}

/**
 * ## Retuple Invalid Result Error
 *
 * An error thrown when attempting to construct a `Result` from a native tuple,
 * when neither index 0 or 1 are null or undefined. In this case, it is impossible
 * to determine whether the result should be `Ok` or `Err`.
 */
export class RetupleInvalidResultError extends Error {
  constructor(public value: unknown[]) {
    super(
      "Constructing a Result from native tuple failed, at least one of the values at index 0 or 1 should be null or undefined"
    );
  }
}

/**
 * ## Result
 *
 * @TODO
 */
export function Result<
  R extends
    | [err: null | undefined, value: unknown]
    | [err: unknown, value: null | undefined],
>(
  resultLike: R
): (
  R extends [null | undefined, infer T]
    ? Ok<T>
    : R extends [infer E, null | undefined]
      ? Err<E>
      : never
) extends Ok<infer T> | Err<infer E>
  ? Result<T, NonNullable<E>>
  : never {
  const [err, ok] = resultLike;

  if (err === null || err === undefined) {
    return new ResultOk(ok) as any;
  }

  if (ok === null || ok === undefined) {
    return new ResultErr(err) as any;
  }

  throw new RetupleInvalidResultError(resultLike);
}

Result.Ok = Ok;
Result.Err = Err;
Result.nonNullable = nonNullable;
Result.truthy = truthy;
Result.safe = safe;
Result.safeAsync = safeAsync;
Result.safePromise = safePromise;

Object.freeze(Result);

/**
 * ## Ok
 *
 * @TODO
 */
export function Ok(): Ok<void>;
export function Ok<const T>(val: T): Ok<T>;
export function Ok<const T>(val?: T): Ok<T | void> {
  return new ResultOk<T | void, never>(val) as any;
}

/**
 * ## Err
 *
 * @TODO
 */
export function Err(): Err<void>;
export function Err<const E>(err: E): Err<E>;
export function Err<const E>(err?: E): Err<E | void> {
  return new ResultErr<never, E | void>(err) as any;
}

/**
 * Construct a {@link Result} from a value. If the value is neither null or
 * undefined, the result is `Ok`.
 */
export function nonNullable<const T>(value: T): Result<NonNullable<T>, true>;
export function nonNullable<const T, const E>(
  value: T,
  error: () => E
): Result<NonNullable<T>, E>;
export function nonNullable<T, E>(
  value: T,
  error: () => E = mapTrue
): Result<NonNullable<T>, E> {
  if (value !== null && value !== undefined) {
    return new ResultOk(value) as Result<NonNullable<T>, E>;
  }

  return new ResultErr(error());
}

/**
 * Construct a {@link Result} from a value. If the value is truthy, the result
 * is `Ok`.
 */
export function truthy<const T>(value: T): Result<Truthy<T>, true>;
export function truthy<const T, const E>(
  value: T,
  error: () => E
): Result<Truthy<T>, E>;
export function truthy<T, E>(
  value: T,
  error: () => E = mapTrue
): Result<Truthy<T>, E> {
  if (value) {
    return new ResultOk(value) as Result<Truthy<T>, E>;
  }

  return new ResultErr(error());
}

/**
 * Construct a {@link Result} from a synchronous function call. If the function
 * returns without throwing, the result is `Ok`.
 */
export function safe<T>(f: () => Awaited<T>): Result<T, Error>;
export function safe<T, E>(
  f: () => Awaited<T>,
  mapError: (err: unknown) => E
): Result<T, E>;
export function safe<T, E>(
  f: () => Awaited<T>,
  mapError: (err: unknown) => E = ensureError
): Result<T, E> {
  try {
    return new ResultOk<T, E>(f());
  } catch (err) {
    return new ResultErr(mapError(err));
  }
}

/**
 * Construct a {@link ResultAsync} from a function call. If the function returns
 * without throwing, and any promise returned resolves, the result is `Ok`.
 */
export function safeAsync<T>(
  f: () => T | PromiseLike<T>
): ResultAsync<T, Error>;
export function safeAsync<T, E>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E
): ResultAsync<T, E>;
export function safeAsync<T, E>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E = ensureError
): ResultAsync<T, E> {
  return new ResultAsync(
    (async () => {
      try {
        return new ResultOk(await f());
      } catch (err) {
        return new ResultErr(await mapError(err));
      }
    })()
  );
}

/**
 * Construct a {@link Result} from a promise. If the promise resolves, the
 * result is `Ok`.
 */
export function safePromise<T>(promise: PromiseLike<T>): ResultAsync<T, Error>;
export function safePromise<T, E>(
  promise: PromiseLike<T>,
  mapError: (err: unknown) => E
): ResultAsync<T, E>;
export function safePromise<T, E>(
  promise: PromiseLike<T>,
  mapError: (err: unknown) => E = ensureError
): ResultAsync<T, E> {
  return new ResultAsync(
    promise.then(Ok<T>, async (err) => Err(await mapError(err)))
  );
}

/**
 * ## Ok
 *
 * @TODO
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

  toJSON(): T {
    return this[1];
  }

  $toNativeTuple(this: Ok<T>): OkTuple<T> {
    return [undefined, this[1]];
  }

  $value(this: Ok<T>): T | E {
    return this[1];
  }

  $ok(this: Ok<T>): T {
    return this[1];
  }

  $isOk(this: Ok<T>): this is Ok<T> {
    return true;
  }

  $isOkAnd<U extends T>(
    this: Ok<T>,
    f: ((val: T) => val is U) | ((val: T) => boolean)
  ): this is Ok<U> {
    return !!f(this[1] as T);
  }

  $isErr(this: Ok<T>): this is never {
    return false;
  }

  $isErrAnd(this: Ok<T>): this is never {
    return false;
  }

  $expect(this: Ok<T>): T {
    return this[1];
  }

  $unwrap(this: Ok<T>): T {
    return this[1];
  }

  $unwrapErr(this: Ok<T>, msg?: string): never {
    throw new RetupleUnwrapErrFailed(this[1], msg);
  }

  $unwrapOr(this: Ok<T>): T {
    return this[1];
  }

  $unwrapOrElse(this: Ok<T>): T {
    return this[1];
  }

  $map<U>(this: Ok<T>, f: (value: T) => U): Ok<U> {
    return new ResultOk(f(this[1]));
  }

  $mapErr(this: Ok<T>): Ok<T> {
    return this;
  }

  $mapOr<U, V>(this: Ok<T>, _def: U, f: (val: T) => V): Ok<V> {
    return new ResultOk(f(this[1]));
  }

  $mapOrElse<U, V>(this: Ok<T>, _def: (err: E) => U, f: (val: T) => V): Ok<V> {
    return new ResultOk(f(this[1]));
  }

  $assertOr<U, F, A extends T>(
    this: Ok<T>,
    def: Result<U, F>,
    condition: ((val: T) => unknown) | ((val: T) => val is A) = isTruthy
  ): Result<T | U | A | Truthy<T>, E | F> {
    return condition(this[1]) ? this : def;
  }

  $assertOrElse<U, F, A extends T>(
    this: Ok<T>,
    def: () => Result<U, F>,
    condition: ((val: T) => unknown) | ((val: T) => val is A) = isTruthy
  ): Result<T | U | A | Truthy<T>, E | F> {
    return condition(this[1]) ? this : def();
  }

  $or(this: Ok<T>): Ok<T> {
    return this;
  }

  $orElse(this: Ok<T>): Ok<T> {
    return this;
  }

  $orSafe(this: Ok<T>): Ok<T> {
    return this;
  }

  $and<U, F>(this: Ok<T>, and: Result<U, F>): Result<U, F> {
    return and;
  }

  $andThen<U, F>(this: Ok<T>, f: (val: T) => Result<U, F>): Result<U, F> {
    return f(this[1]);
  }

  $andThrough<F>(this: Ok<T>, f: (val: T) => Result<any, F>): Result<T, F> {
    const res = f(this[1]);

    return res instanceof ResultErr ? res : this;
  }

  $andSafe<U, F>(
    this: Ok<T>,
    f: (val: T) => U,
    mapError: (err: unknown) => F = ensureError
  ): Result<T | U, E | F> {
    try {
      return new ResultOk<T | U, never>(f(this[1]));
    } catch (err) {
      return new ResultErr<never, E | F>(mapError(err));
    }
  }

  $peek(this: Ok<T>, f: (res: Result<T, E>) => void): Ok<T> {
    f(this);

    return this;
  }

  $tap(this: Ok<T>, f: (val: T) => any): Ok<T> {
    f(this[1]);

    return this;
  }

  $tapErr(this: Ok<T>): Ok<T> {
    return this;
  }

  $flatten<U, F>(this: Ok<Result<U, F>>): Result<U, F> {
    return this[1];
  }

  $async(this: Ok<T>): ResultAsync<T, never> {
    return new ResultAsync(Promise.resolve(this));
  }

  $promise(this: Ok<T>): Promise<Ok<T>> {
    return Promise.resolve(this);
  }
}

/**
 * ## Err
 *
 * @TODO
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

  toJSON(): null {
    return null;
  }

  $toNativeTuple(this: Err<E>): ErrTuple<E> {
    return [this[0], undefined];
  }

  $value(this: Err<E>): T | E {
    return this[0];
  }

  $ok(this: Err<E>): undefined {
    undefined;
  }

  $isOk(this: Err<E>): this is never {
    return false;
  }

  $isOkAnd(this: Err<E>): this is never {
    return false;
  }

  $isErr(this: Err<E>): this is Err<E> {
    return true;
  }

  $isErrAnd<F extends E>(
    this: Err<E>,
    f: ((err: E) => err is F) | ((err: E) => boolean)
  ): this is Err<F> {
    return !!f(this[0]);
  }

  $expect(this: Err<Error>): never {
    if (this[0] instanceof Error) {
      throw this[0];
    }

    throw new RetupleExpectFailed(this[0]);
  }

  $unwrap(this: Err<E>, msg?: string): T {
    throw new RetupleUnwrapFailed(this[0], msg);
  }

  $unwrapErr(this: Err<E>): E {
    return this[0] as E;
  }

  $unwrapOr<U>(this: Err<E>, def: U): U {
    return def;
  }

  $unwrapOrElse<U>(this: Err<E>, f: () => U): U {
    return f();
  }

  $map(this: Err<E>): Err<E> {
    return this;
  }

  $mapErr<F>(this: Err<E>, f: (err: E) => F): Err<F> {
    return new ResultErr(f(this[0]));
  }

  $mapOr<U>(this: Err<E>, def: U): Ok<U> {
    return new ResultOk(def);
  }

  $mapOrElse<U>(this: Err<E>, def: (err: E) => U): Ok<U> {
    return new ResultOk(def(this[0]));
  }

  $assertOr(this: Err<E>): Err<E> {
    return this;
  }

  $assertOrElse(this: Err<E>): Err<E> {
    return this;
  }

  $or<U, F>(this: Err<E>, or: Result<U, F>): Result<U, F> {
    return or;
  }

  $orElse<U, F>(this: Err<E>, f: (err: E) => Result<U, F>): Result<U, F> {
    return f(this[0]);
  }

  $orSafe<U, F>(
    this: Err<E>,
    f: (err: E) => U,
    mapError: (err: unknown) => F = ensureError
  ): Result<T | U, E | F> {
    try {
      return new ResultOk<T | U, never>(f(this[0]));
    } catch (err) {
      return new ResultErr<never, E | F>(mapError(err));
    }
  }

  $and(this: Err<E>): Err<E> {
    return this;
  }

  $andThen(this: Err<E>): Err<E> {
    return this;
  }

  $andThrough(this: Err<E>): Err<E> {
    return this;
  }

  $andSafe(this: Err<E>): Err<E> {
    return this;
  }

  $peek(this: Err<E>, f: (res: Err<E>) => void): Err<E> {
    f(this);

    return this;
  }

  $tap(this: Err<E>): Err<E> {
    return this;
  }

  $tapErr(this: Err<E>, f: (err: E) => void): Err<E> {
    f(this[0]);

    return this;
  }

  $flatten(this: Err<E>): Err<E> {
    return this;
  }

  $async(this: Err<E>): ResultAsync<never, E> {
    return new ResultAsync(Promise.resolve(this));
  }

  $promise(this: Err<E>): Promise<Err<E>> {
    return Promise.resolve(this);
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
    onrejected?: ((reason: any) => F | PromiseLike<F>) | null | undefined
  ): PromiseLike<U | F> {
    return this.#inner.then(onfulfilled, onrejected);
  }

  /**
   * @TODO
   */
  async $toNativeTuple(
    this: ResultAsync<T, E>
  ): Promise<OkTuple<T> | ErrTuple<E>> {
    return (await this.#inner).$toNativeTuple();
  }

  /**
   * @TODO
   */
  async $value(this: ResultAsync<T, E>): Promise<T | E> {
    return (await this.#inner).$value();
  }

  /**
   * @TODO
   */
  async $ok(this: ResultAsync<T, E>): Promise<T | undefined> {
    return (await this.#inner).$ok();
  }

  /**
   * @TODO
   */
  async $expect(this: ResultAsync<T, Error>): Promise<T> {
    return (await this.#inner).$expect();
  }

  /**
   * @TODO
   */
  async $unwrap(this: ResultAsync<T, E>, msg?: string): Promise<T> {
    return (await this.#inner).$unwrap(msg);
  }

  /**
   * @TODO
   */
  async $unwrapErr(this: ResultAsync<T, E>, msg?: string): Promise<E> {
    return (await this.#inner).$unwrapErr(msg);
  }

  /**
   * @TODO
   */
  async $unwrapOr<U>(this: ResultAsync<T, E>, def: U): Promise<T | U> {
    return (await this.#inner).$unwrapOr(def);
  }

  /**
   * @TODO
   */
  async $unwrapOrElse<U>(this: ResultAsync<T, E>, f: () => U): Promise<T | U> {
    const res = await this.#inner;

    return res instanceof ResultOk ? res[1] : f();
  }

  /**
   * @TODO
   */
  $map<U>(this: ResultAsync<T, E>, f: (val: T) => U): ResultAsync<U, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk<U, E>(f(res[1]))
          : (res as Result<any, E>);
      })
    );
  }

  /**
   * @TODO
   */
  $mapErr<F>(this: ResultAsync<T, E>, f: (err: E) => F): ResultAsync<T, F> {
    return new ResultAsync<T, F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr
          ? new ResultErr<T, F>(f(res[0] as E))
          : (res as Ok<T>);
      })
    );
  }

  /**
   * @TODO
   */
  $mapOr<U, V>(
    this: ResultAsync<T, E>,
    def: U,
    f: (val: T) => V
  ): ResultAsync<U | V, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk(f(res[1] as T))
          : new ResultOk(def);
      })
    );
  }

  /**
   * @TODO
   */
  $mapOrElse<U, V>(
    this: ResultAsync<T, E>,
    def: (err: E) => U,
    f: (val: T) => V
  ): ResultAsync<U | V, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk(f(res[1]))
          : new ResultOk(def(res[0] as E));
      })
    );
  }

  /**
   * ## $assertOr
   *
   * {@link Retuple.$assertOr|$assertOr}
   */
  $assertOr<U, F>(
    this: ResultAsync<T, E>,
    def: Result<U, F> | PromiseLike<Result<U, F>>
  ): ResultAsync<Truthy<T>, E | F>;
  $assertOr<U, F, A extends T>(
    this: ResultAsync<T, E>,
    def: Result<U, F> | PromiseLike<Result<U, F>>,
    predicate: (val: T) => val is A
  ): ResultAsync<U | A, E | F>;
  $assertOr<U, F>(
    this: ResultAsync<T, E>,
    def: Result<U, F> | PromiseLike<Result<U, F>>,
    condition: (val: T) => unknown
  ): ResultAsync<T | U, E | F>;
  $assertOr<U, F, A extends T>(
    this: ResultAsync<T, E>,
    def: Result<U, F> | PromiseLike<Result<U, F>>,
    condition: ((val: T) => unknown) | ((val: T) => val is A) = isTruthy
  ): ResultAsync<T | U | A | Truthy<T>, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr || condition(res[1] as T)) {
          return res as Result<T | U, E>;
        }

        return await def;
      })
    );
  }

  $assertOrElse<U, F>(
    this: ResultAsync<T, E>,
    def: () => Result<U, F> | PromiseLike<Result<U, F>>
  ): ResultAsync<Truthy<T>, E | F>;
  $assertOrElse<U, F, A extends T>(
    this: ResultAsync<T, E>,
    def: () => Result<U, F> | PromiseLike<Result<U, F>>,
    predicate: (val: T) => val is A
  ): ResultAsync<U | A, E | F>;
  $assertOrElse<U, F>(
    this: ResultAsync<T, E>,
    def: () => Result<U, F> | PromiseLike<Result<U, F>>,
    condition: (val: T) => unknown
  ): ResultAsync<T | U, E | F>;
  $assertOrElse<U, F, A extends T>(
    this: ResultAsync<T, E>,
    def: () => Result<U, F> | PromiseLike<Result<U, F>>,
    condition: ((val: T) => unknown) | ((val: T) => val is A) = isTruthy
  ): ResultAsync<T | U | A | Truthy<T>, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr || condition(res[1] as T)) {
          return res as Result<T | U, E>;
        }

        return await def();
      })
    );
  }

  /**
   * @TODO
   */
  $or<U, F>(
    this: ResultAsync<T, E>,
    or: Result<U, F> | PromiseLike<Result<U, F>>
  ): ResultAsync<T | U, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr ? await or : (res as Ok<T>);
      })
    );
  }

  /**
   * @TODO
   */
  $orElse<U, F>(
    this: ResultAsync<T, E>,
    f: (err: E) => Result<U, F> | PromiseLike<Result<U, F>>
  ): ResultAsync<T | U, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr ? await f(res[0] as E) : (res as Ok<T>);
      })
    );
  }

  /**
   * @TODO
   */
  $orSafe<U>(
    this: ResultAsync<T, E>,
    f: (err: E) => U | PromiseLike<U>
  ): ResultAsync<T | U, E | Error>;
  $orSafe<U, F>(
    this: ResultAsync<T, E>,
    f: (err: E) => U | PromiseLike<U>,
    mapError: (err: unknown) => F
  ): ResultAsync<T | U, E | F>;
  $orSafe<U, F>(
    this: ResultAsync<T, E>,
    f: (err: E) => U | PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError
  ): ResultAsync<T | U, E | F | Error> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultOk) {
          return res;
        }

        try {
          return new ResultOk<U, E>(await f(res[0] as E));
        } catch (err) {
          return new ResultErr<T, F>(mapError(err));
        }
      })
    );
  }

  /**
   * @TODO
   */
  $and<U, F>(
    this: ResultAsync<T, E>,
    and: Result<U, F> | PromiseLike<Result<U, F>>
  ): ResultAsync<U, E | F> {
    return new ResultAsync<U, E | F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk ? await and : (res as Err<E>);
      })
    );
  }

  /**
   * @TODO
   */
  $andThen<U, F>(
    this: ResultAsync<T, E>,
    f: (val: T) => Result<U, F> | PromiseLike<Result<U, F>>
  ): ResultAsync<U, E | F> {
    return new ResultAsync<U, E | F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk ? await f(res[1]) : (res as Err<E>);
      })
    );
  }

  /**
   * @TODO
   */
  $andThrough<F>(
    this: ResultAsync<T, E>,
    f: (val: T) => Result<any, F> | PromiseLike<Result<any, F>>
  ): ResultAsync<T, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultOk) {
          const through = await f(res[1]);

          if (through instanceof ResultErr) {
            return through;
          }
        }

        return res as Ok<T>;
      })
    );
  }

  /**
   * @TODO
   */
  $andSafe<U>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | PromiseLike<U>
  ): ResultAsync<T | U, E | Error>;
  $andSafe<U, F>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | PromiseLike<U>,
    mapError: (err: unknown) => F
  ): ResultAsync<T | U, E | F>;
  $andSafe<U, F>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError
  ): ResultAsync<U, E | F | Error> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          return res;
        }

        try {
          return new ResultOk<U, E>(await f(res[1] as T));
        } catch (err) {
          return new ResultErr<U, F>(mapError(err));
        }
      })
    );
  }

  /**
   * @TODO
   */
  $peek(
    this: ResultAsync<T, E>,
    f: (res: Result<T, E>) => any
  ): ResultAsync<T, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        await f(res);

        return res;
      })
    );
  }

  /**
   * @TODO
   */
  $tap(this: ResultAsync<T, E>, f: (val: T) => any): ResultAsync<T, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultOk) {
          await f(res[1]);
        }

        return res;
      })
    );
  }

  /**
   * @TODO
   */
  $tapErr(this: ResultAsync<T, E>, f: (err: E) => any): ResultAsync<T, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        if (res instanceof ResultErr) {
          await f(res[0]);
        }

        return res;
      })
    );
  }

  /**
   * @TODO
   */
  $promise(this: ResultAsync<T, E>): Promise<Result<T, E>> {
    return Promise.resolve(this);
  }
}

function ensureError<E = Error>(err: unknown): E {
  if (err instanceof Error) {
    return err as E;
  }

  return new RetupleThrownValueError(err) as E;
}

function mapTrue<E>(): E {
  return true as E;
}

function isTruthy<T>(val: T): val is Truthy<T> {
  return !!val;
}

type OkTuple<T> = [err: undefined, value: T];
type ErrTuple<E> = [err: E, value: undefined];

type Truthy<T> = Exclude<T, false | null | undefined | 0 | 0n | "">;

/**
 * @TODO - Result.all / Result.any
 */

// type OkTypes<R extends Result<any, any>[]> = {
//   [I in keyof R]: R[I] extends Result<infer T, any> ? T : never;
// };

// type ErrTypes<R extends Result<any, any>[]> = {
//   [I in keyof R]: R[I] extends Result<any, infer E> ? E : never;
// };

interface Retuple<T, E> {
  /**
   * @TODO
   */
  $toNativeTuple(this: Result<T, E>): OkTuple<T> | ErrTuple<E>;

  /**
   * @TODO
   */
  $value(this: Result<T, E>): T | E;

  /**
   * @TODO
   */
  $ok(this: Result<T, E>): T | undefined;

  /**
   * @TODO
   */
  $isOk(this: Result<T, E>): this is Ok<T>;

  /**
   * @TODO
   */
  $isOkAnd<U extends T>(
    this: Result<T, E>,
    predicate: (val: T) => val is U
  ): this is Ok<U>;
  $isOkAnd(this: Result<T, E>, predicate: (val: T) => unknown): this is Ok<T>;

  /**
   * @TODO
   */
  $isErr(this: Result<T, E>): this is Err<E>;

  /**
   * @TODO
   */
  $isErrAnd<F extends E>(
    this: Result<T, E>,
    prediacte: (val: E) => val is F
  ): this is Err<F>;
  $isErrAnd(this: Result<T, E>, predicate: (val: E) => unknown): this is Err<E>;

  /**
   * @TODO
   */
  $expect(this: Result<T, Error>): T;

  /**
   * @TODO
   */
  $unwrap(this: Result<T, E>, msg?: string): T;

  /**
   * @TODO
   */
  $unwrapErr(this: Result<T, E>, msg?: string): E;

  /**
   * @TODO
   */
  $unwrapOr<const U>(this: Result<T, E>, def: U): T | U;

  /**
   * @TODO
   */
  $unwrapOrElse<U>(this: Result<T, E>, f: () => U): T | U;

  /**
   * @TODO
   */
  $map<U>(this: Result<T, E>, f: (value: T) => U): Result<U, E>;

  /**
   * @TODO
   */
  $mapErr<F>(this: Result<T, E>, f: (err: E) => F): Result<T, F>;

  /**
   * @TODO
   */
  $mapOr<U, V = U>(
    this: Result<T, E>,
    def: U,
    f: (val: T) => V
  ): Result<U | V, E>;

  /**
   * @TODO
   */
  $mapOrElse<U, V = U>(
    this: Result<T, E>,
    def: (err: E) => U,
    f: (val: T) => V
  ): Result<U | V, E>;

  /**
   * @TODO
   */
  $or<U, F>(this: Result<T, E>, or: Result<U, F>): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $orElse<U, F>(
    this: Result<T, E>,
    f: (err: E) => Result<U, F>
  ): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $orSafe<U>(this: Result<T, E>, f: (err: E) => U): Result<T | U, E | Error>;
  $orSafe<U, F>(
    this: Result<T, E>,
    f: (err: E) => U,
    mapError: (err: unknown) => F
  ): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $and<U, F>(this: Result<T, E>, and: Result<U, F>): Result<U, E | F>;

  /**
   * @TODO
   */
  $andThen<U, F>(
    this: Result<T, E>,
    f: (val: T) => Result<U, F>
  ): Result<U, E | F>;

  /**
   * @TODO
   */
  $andThrough<F>(
    this: Result<T, E>,
    f: (val: T) => Result<any, F>
  ): Result<T, E | F>;

  /**
   * @TODO
   */
  $andSafe<U>(this: Result<T, E>, f: (val: T) => U): Result<T | U, E | Error>;
  $andSafe<U, F>(
    this: Result<T, E>,
    f: (val: T) => U,
    mapError: (err: unknown) => F
  ): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $assertOr<U, F>(
    this: Result<T, E>,
    def: Result<U, F>
  ): Result<Truthy<T>, E | F>;
  $assertOr<U, F, A extends T>(
    this: Result<T, E>,
    def: Result<U, F>,
    predicate: (val: T) => val is A
  ): Result<U | A, E | F>;
  $assertOr<U, F>(
    this: Result<T, E>,
    def: Result<U, F>,
    condition: (val: T) => unknown
  ): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $assertOrElse<U, F>(
    this: Result<T, E>,
    def: () => Result<U, F>
  ): Result<Truthy<T>, E | F>;
  $assertOrElse<U, F, A extends T>(
    this: Result<T, E>,
    def: () => Result<U, F>,
    predicate: (val: T) => val is A
  ): Result<U | A, E | F>;
  $assertOrElse<U, F>(
    this: Result<T, E>,
    def: () => Result<U, F>,
    condition: (val: T) => unknown
  ): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $peek(this: Result<T, E>, f: (res: Result<T, E>) => void): Result<T, E>;

  /**
   * @TODO
   */
  $tap(this: Result<T, E>, f: (val: T) => any): Result<T, E>;

  /**
   * @TODO
   */
  $tapErr(this: Result<T, E>, f: (err: E) => void): Result<T, E>;

  /**
   * @TODO
   */
  $flatten<U, F>(this: Result<Result<U, F>, E>): Result<U, E | F>;

  /**
   * @TODO
   */
  $async(this: Result<T, E>): ResultAsync<T, E>;

  /**
   * @TODO
   */
  $promise(this: Result<T, E>): Promise<Result<T, E>>;

  /**
   * Mark standard array methods as deprecated, to assist with type hinting.
   */

  /**
   * @deprecated
   */
  at(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  concat(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  copyWithin(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  entries(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  every(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  fill(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  filter(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  find(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  findIndex(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  flat(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  flatMap(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  forEach(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  includes(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  indexOf(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  join(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  keys(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  lastIndexOf(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  map(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  pop(...args: unknown[]): any;

  /**
   * @deprecated
   */
  push(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  reduce(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  reduceRight(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  reverse(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  shift(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  slice(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  some(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  sort(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  splice(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  toString(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  toLocaleString(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  unshift(...args: unknown[]): unknown;

  /**
   * @deprecated
   */
  values(...args: unknown[]): unknown;
}
