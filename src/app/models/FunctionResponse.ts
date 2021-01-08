export interface FunctionResponse {
  error: boolean;
  success: boolean;
  message: string;
  data?: {uiMessage: string} | any;
  code?: number | null;
}
