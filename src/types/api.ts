// API response and request types

export interface ApiSuccessResponse<T = unknown> {
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Array<{ field: string; message: string }>;
  statusCode?: number;
}
