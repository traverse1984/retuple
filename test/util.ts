export function capture(fn: () => any): any {
  try {
    fn();
  } catch (err) {
    return err;
  }
}

export const errThrow = new Error("Test throw error");
export const errReject = new Error("Test reject error");

export function fnThrow(): any {
  throw errThrow;
}

export async function fnReject(): Promise<any> {
  throw errReject;
}
