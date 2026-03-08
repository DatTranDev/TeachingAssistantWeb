import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function normalizeError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const data = error.response?.data as { message?: string } | undefined;
  return new ApiError(data?.message ?? 'An unexpected error occurred', status);
}

// ── Token refresh state ──────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

// Lazy imports to avoid circular deps (auth store injected at runtime)
type AuthStoreActions = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string) => void;
  signOut: () => void;
};

let _authStore: AuthStoreActions | null = null;

export function injectAuthStore(store: AuthStoreActions) {
  _authStore = store;
}

async function refreshAccessToken(): Promise<string> {
  const { data } = await axios.get<{ access_token: string }>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/token/refresh-token`,
    { withCredentials: true }
  );
  return data.access_token;
}

// ── Axios instance ────────────────────────────────────────────────────────────

export const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,
});

// Request interceptor — inject access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = _authStore?.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        _authStore?.setAccessToken(newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        _authStore?.signOut();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(normalizeError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  }
);
