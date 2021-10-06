export interface FnResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  code?: number;
}
