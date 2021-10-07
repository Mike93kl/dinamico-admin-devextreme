import {FnResponse} from './FnResponse_v1';

export interface FnError {
  message: string;
  code?: number;
}

function instanceOfFnError(o: any): boolean {
  return 'message' in o && 'code' in o;
}

function unexpected_fn_error(): FnError {
  return {
    message: 'An unexpected error occurred',
    code: null
  };
}

export function error(e: any): FnError {
  if (instanceOfFnError(e)) { return e; }
  return unexpected_fn_error();
}

export function handle<T>(res: FnResponse<T>): T {
  if (res.success) {
    return res.data;
  }
  throw {
    message: res.message,
    code: res.code
  } as FnError;
}
