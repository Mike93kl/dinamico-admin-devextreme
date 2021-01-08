import {FunctionResponse} from '../models/FunctionResponse';
import {UNEXPECTED_ERROR} from './ui_messages';

export function handleFunctionResponseWithPromise(promise: any, response: FunctionResponse): any {
  if (response.success) {
    return promise.resolve();
  }
  console.log('FN RES: ', response);
  if (response.data && response.data.uiMessage) {
    return promise.reject(response.data.uiMessage);
  }
  return promise.reject(UNEXPECTED_ERROR);
}

export function rejectFunctionResponsePromise(promise: any, error: any): any {
  console.log('FN ERROR: ', error);
  return promise.reject(UNEXPECTED_ERROR);
}
