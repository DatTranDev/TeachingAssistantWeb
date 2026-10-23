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
  const data = error.response?.data as { message?: string; code?: string } | undefined;
  return new ApiError(data?.message ?? 'An unexpected error occurred', status, data?.code);
}

// ── Token refresh state ──────────────────────────────────────────────────────

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

let refreshPromise: Promise<string> | null = null;
export function refreshSession(): Promise<string> {
  if (!refreshPromise) {
    const previousToken = _authStore?.getAccessToken();
    refreshPromise = axios
      .get<{ accessToken: string }>('/api/auth/refresh', { withCredentials: true })
      .then(({ data }) => {
        if (_authStore?.getAccessToken() !== previousToken)
          throw new ApiError('Session changed', 409, 'SESSION_CHANGED');
        _authStore?.setAccessToken(data.accessToken);
        return data.accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
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

    const publicOrPassword = /\/(user\/(login|register|changepassword)|service\/)/.test(
      original?.url ?? ''
    );
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !publicOrPassword &&
      _authStore?.getAccessToken()
    ) {
      original._retry = true;
      try {
        const newToken = await refreshSession();
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshError) {
        if (
          axios.isAxiosError(refreshError) &&
          [401, 403].includes(refreshError.response?.status ?? 0)
        ) {
          _authStore?.signOut();
          if (typeof window !== 'undefined') window.location.href = '/login';
        }
      }
    }

    return Promise.reject(normalizeError(error));
  }
);
