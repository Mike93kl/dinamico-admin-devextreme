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
    message: 'An unexpected error occured',
    code: null
  };
}

export function newFnError(e: any): FnError {
  if (instanceOfFnError(e)) { return e; }
  return unexpected_fn_error();
}

export function handle_fn<T>(res: FnResponse<T>): T {
  if (res.success) {
    return res.data;
  }
  throw {
    message: res.message,
    code: res.code
  } as FnError;
}
