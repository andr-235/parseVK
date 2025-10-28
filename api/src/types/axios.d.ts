declare module 'axios' {
  export interface AxiosRequestConfig {
    baseURL?: string;
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean>;
    timeout?: number;
  }

  export interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
  }

  export interface AxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
  }

  export interface AxiosError extends Error {
    isAxiosError: true;
    response?: AxiosResponse;
  }

  export interface AxiosStatic {
    create(config?: AxiosRequestConfig): AxiosInstance;
    isAxiosError(error: unknown): error is AxiosError;
  }

  const axios: AxiosStatic;
  export default axios;
}
