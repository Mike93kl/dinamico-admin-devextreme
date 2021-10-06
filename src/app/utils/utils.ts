import {FunctionResponse} from '../models/fn/FunctionResponse';
import {MSG_UNEXPECTED_ERROR} from './ui_messages';

export function handleFunctionResponseWithPromise(promise: any, response: FunctionResponse): any {
  if (response.success) {
    return promise.resolve();
  }
  console.log('FN RES: ', response);
  if (response.data && response.data.uiMessage) {
    return promise.reject(response.data.uiMessage);
  }
  return promise.reject(MSG_UNEXPECTED_ERROR);
}

export function rejectFunctionResponsePromise(promise: any, error: any): any {
  console.log('FN ERROR: ', error);
  return promise.reject(MSG_UNEXPECTED_ERROR);
}
