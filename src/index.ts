export type Ok<T> = OkTuple<T> & Retuple<T, never>;
export type Err<E> = ErrTuple<E> & Retuple<never, E>;
export type Result<T, E> = (OkTuple<T> | ErrTuple<E>) & Retuple<T, E>;

export { type ResultAsync };

export class RetupleUnwrapFailed<E = unknown> extends Error {
  constructor(
    public value: E,
    msg = "Unwrap failed",
  ) {
    super(msg, value instanceof Error ? { cause: value } : undefined);
  }
}

export class RetupleUnwrapErrFailed<T = unknown> extends Error {
  constructor(
    public value: T,
    msg = "Unwrap error failed",
  ) {
    super(msg);
  }
}

export class RetupleExpectFailed<E = unknown> extends Error {
  constructor(public value: E) {
    super("Expect failed");
  }
}

export class RetupleThrownValueError extends Error {
  constructor(public value: unknown) {
    super("Caught value was not an instance of Error");
  }
}

/**
 * ## Result
 *
 * @TODO
 */
export const Result = {
  Ok,
  Err,
  from,
  safe,
  safeAsync,
  safePromise,
};

export default Result;

/**
 * ## Ok
 *
 * @TODO
 */
export function Ok(): Ok<void>;
export function Ok<T>(val: T): Ok<T>;
export function Ok<T>(val?: T): Ok<T | void> {
  return new ResultOk<T | void, never>(val);
}

/**
 * ## Err
 *
 * @TODO
 */
export function Err(): Err<void>;
export function Err<E>(err: E): Err<E>;
export function Err<E>(err?: E): Err<E | void> {
  return new ResultErr<never, E | void>(err);
}

/**
 * Construct a {@link Result} from a value. If the value is truthy, the result
 * is `Ok`.
 */
export function from<T>(value: T): Result<Truthy<T>, true>;
export function from<T, E>(value: T, error: () => E): Result<Truthy<T>, E>;
export function from<T, E>(value: T, error?: () => E): Result<Truthy<T>, E> {
  if (value) {
    return new ResultOk(value) as Result<Truthy<T>, E>;
  }

  if (error) {
    return new ResultErr(error());
  }

  return new ResultErr(true as E);
}

/**
 * Construct a {@link Result} from a synchronous function call. If the function
 * returns without throwing, the result is `Ok`.
 */
export function safe<T>(f: () => Awaited<T>): Result<T, Error>;
export function safe<T, E>(
  f: () => Awaited<T>,
  mapError: (err: unknown) => E,
): Result<T, E>;
export function safe<T, E = Error>(
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
 */
export function safeAsync<T>(
  f: () => T | PromiseLike<T>,
): ResultAsync<T, Error>;
export function safeAsync<T, E>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E,
): ResultAsync<T, E>;
export function safeAsync<T, E = Error>(
  f: () => T | PromiseLike<T>,
  mapError: (err: unknown) => E = ensureError,
): ResultAsync<T, E> {
  return new ResultAsync(
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
 */
export function safePromise<T>(promise: PromiseLike<T>): ResultAsync<T, Error>;
export function safePromise<T, E>(
  promise: PromiseLike<T>,
  mapError: (err: unknown) => E,
): ResultAsync<T, E>;
export function safePromise<T, E = Error>(
  promise: PromiseLike<T>,
  mapError: (err: unknown) => E | PromiseLike<E> = ensureError,
): ResultAsync<T, E> {
  return new ResultAsync(
    promise.then(Ok<T>, async (err) => Err(await mapError(err))),
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

  $value(this: Ok<T>): T | E {
    return this[1];
  }

  $isOk(this: Ok<T>): this is Ok<T> {
    return true;
  }

  $isOkAnd<U extends T>(
    this: Ok<T>,
    f: ((val: T) => val is U) | ((val: T) => boolean),
  ): this is Ok<U> {
    return f(this[1] as T);
  }

  $isErr(this: Ok<T>): this is Err<E> {
    return false;
  }

  $isErrAnd<F extends E = E>(this: Ok<T>): this is Err<F> {
    return false;
  }

  $expect(this: Ok<T>): T {
    return this[1];
  }

  $unwrap(this: Ok<T>): T {
    return this[1];
  }

  $unwrapErr(this: Ok<T>, msg?: string): E {
    throw new RetupleUnwrapErrFailed(this[1], msg);
  }

  $unwrapOr(this: Ok<T>): T {
    return this[1];
  }

  $unwrapOrElse(this: Ok<T>): T {
    return this[1];
  }

  $map<U>(this: Ok<T>, f: (value: T) => U): Result<U, E> {
    return new ResultOk(f(this[1]));
  }

  $mapErr<F>(this: Ok<T>): Result<T, F> {
    return this as unknown as Result<T, F>;
  }

  $mapOr<U>(this: Ok<T>, _def: U, f: (val: T) => U): Result<U, E> {
    return new ResultOk(f(this[1]));
  }

  $mapOrElse<U>(
    this: Ok<T>,
    _def: (err: E) => U,
    f: (val: T) => U,
  ): Result<U, E> {
    return new ResultOk(f(this[1]));
  }

  $or<U = T, F = E>(this: Ok<T>): Result<T | U, E | F> {
    return this;
  }

  $orElse<U = T, F = E>(this: Ok<T>): Result<T | U, E | F> {
    return this;
  }

  $orSafe<U = T, F = Error>(this: Ok<T>): Result<T | U, E | F> {
    return this;
  }

  $and<U = T, F = E>(this: Ok<T>, and: Result<U, F>): Result<U, E | F> {
    return and;
  }

  $andThen<U = T, F = E>(
    this: Ok<T>,
    f: (val: T) => Result<U, F>,
  ): Result<U, E | F> {
    return f(this[1]);
  }

  $andThrough<F>(this: Ok<T>, f: (val: T) => Result<any, F>): Result<T, E | F> {
    const res = f(this[1]);

    return res instanceof ResultErr ? res : this;
  }

  $andSafe<U, F = Error>(
    this: Ok<T>,
    f: (val: T) => U,
    mapError: (err: unknown) => F = ensureError,
  ): Result<T | U, E | F> {
    try {
      return new ResultOk(f(this[1])) as Result<U, E>;
    } catch (err) {
      return new ResultErr<T | U, E | F>(mapError(err));
    }
  }

  $peek(this: Ok<T>, f: (res: Result<T, E>) => void): Result<T, E> {
    f(this);

    return this;
  }

  $tap(this: Ok<T>, f: (val: T) => any): Result<T, E> {
    f(this[1]);

    return this;
  }

  $tapErr(this: Ok<T>): Result<T, E> {
    return this;
  }

  $flatten<U, F>(this: Ok<Result<U, F>>): Result<U, E | F> {
    return this[1] as Result<U, F>;
  }

  $async(this: Ok<T>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(this));
  }

  $promise(this: Ok<T>): Promise<Result<T, E>> {
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

  $value(this: Err<E>): T | E {
    return this[0];
  }

  $isOk(this: Err<E>): this is Ok<T> {
    return false;
  }

  $isOkAnd<U extends T>(this: Err<E>): this is Ok<U> {
    return false;
  }

  $isErr(this: Err<E>): this is Err<E> {
    return true;
  }

  $isErrAnd<F extends E = E>(
    this: Err<E>,
    f: ((err: E) => err is F) | ((err: E) => boolean),
  ): this is Err<F> {
    return f(this[0]);
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

  $unwrapOr<U = T>(this: Err<E>, def: U): T | U {
    return def;
  }

  $unwrapOrElse<U = T>(this: Err<E>, f: () => U): T | U {
    return f();
  }

  $map<U>(this: Err<E>): Result<U, E> {
    return this as Err<E>;
  }

  $mapErr<F>(this: Err<E>, f: (err: E) => F): Result<T, F> {
    return new ResultErr(f(this[0]));
  }

  $mapOr<U>(this: Err<E>, def: U): Result<U, E> {
    return new ResultOk(def);
  }

  $mapOrElse<U>(this: Err<E>, def: (err: E) => U): Result<U, E> {
    return new ResultOk(def(this[0]));
  }

  $or<U, F>(this: Err<E>, or: Result<U, F>): Result<T | U, E | F> {
    return or;
  }

  $orElse<U, F>(
    this: Err<E>,
    f: (err: E) => Result<U, F>,
  ): Result<T | U, E | F> {
    return f(this[0]);
  }

  $orSafe<U, F>(
    this: Err<E>,
    f: (err: E) => U,
    mapError: (err: unknown) => F = ensureError,
  ): Result<T | U, E | F> {
    try {
      return new ResultOk(f(this[0])) as Ok<U>;
    } catch (err) {
      return new ResultErr(mapError(err)) as Err<F>;
    }
  }

  $and<U, F>(this: Err<E>): Result<U, E | F> {
    return this;
  }

  $andThen<U, F>(this: Err<E>): Result<U, E | F> {
    return this as Err<E>;
  }

  $andThrough<F>(this: Err<E>): Result<T, E | F> {
    return this;
  }

  $andSafe<U, F = Error>(this: Err<E>): Result<T | U, E | F> {
    return this;
  }

  $peek(this: Err<E>, f: (res: Result<T, E>) => void): Result<T, E> {
    f(this);

    return this;
  }

  $tap(this: Err<E>): Result<T, E> {
    return this;
  }

  $tapErr(this: Err<E>, f: (err: E) => void): Result<T, E> {
    f(this[0]);

    return this;
  }

  $flatten<U, F>(this: Err<E>): Result<U, E | F> {
    return this;
  }

  $async(this: Err<E>): ResultAsync<T, E> {
    return new ResultAsync(Promise.resolve(this));
  }

  $promise(this: Err<E>): Promise<Result<T, E>> {
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

  then<TResult1 = Result<T, E>, TResult2 = never>(
    onfulfilled?:
      | ((result: Result<T, E>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>,
  ): PromiseLike<TResult1 | TResult2> {
    return this.#inner.then(onfulfilled, onrejected);
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
  async $unwrapOrElse<U = T>(
    this: ResultAsync<T, E>,
    f: () => U,
  ): Promise<T | U> {
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
      }),
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
      }),
    );
  }

  /**
   * @TODO
   */
  $mapOr<U>(
    this: ResultAsync<T, E>,
    def: U,
    f: (val: T) => U,
  ): ResultAsync<U, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk<U, never>(f(res[1] as T))
          : new ResultOk<U, any>(def);
      }),
    );
  }

  /**
   * @TODO
   */
  $mapOrElse<U>(
    this: ResultAsync<T, E>,
    def: (err: E) => U,
    f: (val: T) => U,
  ): ResultAsync<U, E> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk
          ? new ResultOk<U, E>(f(res[1]))
          : new ResultOk<U, any>(def(res[0] as E));
      }),
    );
  }

  /**
   * @TODO
   */
  $or<U = T, F = E>(
    this: ResultAsync<T, E>,
    or: Result<U, F> | PromiseLike<Result<U, F>>,
  ): ResultAsync<T | U, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr ? await or : (res as Ok<T>);
      }),
    );
  }

  /**
   * @TODO
   */
  $orElse<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (err: E) => Result<U, F> | PromiseLike<Result<U, F>>,
  ): ResultAsync<T | U, E | F> {
    return new ResultAsync(
      this.#inner.then(async (res) => {
        return res instanceof ResultErr ? await f(res[0] as E) : (res as Ok<T>);
      }),
    );
  }

  /**
   * @TODO
   */
  $orSafe<U = T, F = Error>(
    this: ResultAsync<T, E>,
    f: (err: E) => U | PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<T | U, E | F> {
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
      }),
    );
  }

  /**
   * @TODO
   */
  $and<U = T, F = E>(
    this: ResultAsync<T, E>,
    and: Result<U, F> | PromiseLike<Result<U, F>>,
  ): ResultAsync<U, E | F> {
    return new ResultAsync<U, E | F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk ? await and : (res as Err<E>);
      }),
    );
  }

  /**
   * @TODO
   */
  $andThen<U = T, F = E>(
    this: ResultAsync<T, E>,
    f: (val: T) => Result<U, F> | PromiseLike<Result<U, F>>,
  ): ResultAsync<U, E | F> {
    return new ResultAsync<U, E | F>(
      this.#inner.then(async (res) => {
        return res instanceof ResultOk ? await f(res[1]) : (res as Err<E>);
      }),
    );
  }

  /**
   * @TODO
   */
  $andThrough<F = E>(
    this: ResultAsync<T, E>,
    f: (val: T) => Result<any, F> | PromiseLike<Result<any, F>>,
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
      }),
    );
  }

  /**
   * @TODO
   */
  $andSafe<U = T, F = Error>(
    this: ResultAsync<T, E>,
    f: (val: T) => U | PromiseLike<U>,
    mapError: (err: unknown) => F = ensureError,
  ): ResultAsync<U, E | F> {
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
      }),
    );
  }

  /**
   * @TODO
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
   * @TODO
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
   * @TODO
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

Object.freeze(Result);
Object.freeze(ResultOk);
Object.freeze(ResultErr);
Object.freeze(ResultAsync);
Object.freeze(RetupleUnwrapFailed);
Object.freeze(RetupleUnwrapErrFailed);
Object.freeze(RetupleExpectFailed);
Object.freeze(RetupleThrownValueError);

Object.freeze(ResultOk.prototype);
Object.freeze(ResultErr.prototype);
Object.freeze(ResultAsync.prototype);
Object.freeze(RetupleUnwrapFailed.prototype);
Object.freeze(RetupleUnwrapErrFailed.prototype);
Object.freeze(RetupleExpectFailed.prototype);
Object.freeze(RetupleThrownValueError.prototype);

type OkTuple<T> = [err: undefined, value: T];
type ErrTuple<E> = [err: E, value: undefined];

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
  $isOk(this: Result<T, E>): this is Ok<T>;

  /**
   * @TODO
   */
  $isOkAnd<U extends T = T>(
    this: Result<T, E>,
    f: ((val: T) => val is U) | ((val: T) => boolean),
  ): this is Ok<U>;

  /**
   * @TODO
   */
  $isErr(this: Result<T, E>): this is Err<E>;

  /**
   * @TODO
   */
  $isErrAnd<F extends E = E>(
    this: Result<T, E>,
    f: ((err: E) => err is F) | ((err: E) => boolean),
  ): this is Err<F>;

  /**
   * @TODO
   */
  $value(this: Result<T, E>): T | E;

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
  $unwrapOr<U = T>(this: Result<T, E>, def: U): T | U;

  /**
   * @TODO
   */
  $unwrapOrElse<U = T>(this: Result<T, E>, f: () => U): T | U;

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
  $mapOr<U>(this: Result<T, E>, def: U, f: (val: T) => U): Result<U, E>;

  /**
   * @TODO
   */
  $mapOrElse<U>(
    this: Result<T, E>,
    def: (err: E) => U,
    f: (val: T) => U,
  ): Result<U, E>;

  /**
   * @TODO
   */
  $or<U = T, F = E>(this: Result<T, E>, or: Result<U, F>): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $orElse<U = never, F = never>(
    this: Result<T, E>,
    f: (err: E) => Result<U, F>,
  ): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $orSafe<U = T>(
    this: Result<T, E>,
    f: (err: E) => U,
  ): Result<T | U, E | Error>;
  $orSafe<U = T, F = E>(
    this: Result<T, E>,
    f: (err: E) => U,
    mapError: (err: unknown) => F,
  ): Result<T | U, E | F>;
  $orSafe<U = T, F = Error>(
    this: Result<T, E>,
    f: (err: E) => U,
    mapError: (err: unknown) => F,
  ): Result<T | U, E | F>;

  /**
   * @TODO
   */
  $and<U = T, F = E>(this: Result<T, E>, and: Result<U, F>): Result<U, E | F>;

  /**
   * @TODO
   */
  $andThen<U = never, F = never>(
    this: Result<T, E>,
    f: (val: T) => Result<U, F>,
  ): Result<U, E | F>;

  /**
   * @TODO
   */
  $andThrough<F = never>(
    this: Result<T, E>,
    f: (val: T) => Result<any, F>,
  ): Result<T, E | F>;

  /**
   * @TODO
   */
  $andSafe<U = T>(
    this: Result<T, E>,
    f: (val: T) => U,
  ): Result<T | U, E | Error>;
  $andSafe<U = T, F = E>(
    this: Result<T, E>,
    f: (val: T) => U,
    mapError: (err: unknown) => F,
  ): Result<T | U, E | F>;
  $andSafe<U, F = Error>(
    this: Result<T, E>,
    f: (val: T) => U,
    mapError: (err: unknown) => F,
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
}

type Truthy<T> = Exclude<T, false | null | undefined | 0 | 0n | "">;
