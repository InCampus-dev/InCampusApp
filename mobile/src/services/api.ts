import AsyncStorage from "@react-native-async-storage/async-storage";

type ApiMethod = "GET" | "POST" | "PATCH" | "DELETE";
type ApiParams = Record<string, string | number | boolean | null | undefined>;

interface ApiRequestOptions {
  params?: ApiParams;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

interface ApiErrorEnvelope {
  error?: string | {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

class ApiRequestError extends Error {
  public readonly response: {
    status: number;
    data: unknown;
  };

  public constructor(status: number, data: unknown, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.response = { status, data };
  }
}

class ApiClient {
  public async get<T = unknown>(
    path: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  public async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  public async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }

  public async delete<T = unknown>(
    path: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path, undefined, options);
  }

  private async request<T>(
    method: ApiMethod,
    path: string,
    body?: unknown,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const token = await AsyncStorage.getItem("authToken");
    const response = await fetch(buildUrl(path, options?.params), {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    });
    const responseData = await parseResponse(response);

    if (!response.ok) {
      throw new ApiRequestError(
        response.status,
        responseData,
        getApiErrorMessage({ response: { status: response.status, data: responseData } }) ??
          `Request failed with status ${response.status}`
      );
    }

    return {
      data: responseData as T,
      status: response.status
    };
  }
}

function getBaseUrl(): string {
  const processEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;

  return processEnv?.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
}

function buildUrl(path: string, params?: ApiParams): string {
  const normalizedBaseUrl = getBaseUrl().replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const queryString = buildQueryString(params);

  return `${normalizedBaseUrl}${normalizedPath}${queryString}`;
}

function buildQueryString(params?: ApiParams): string {
  if (!params) {
    return "";
  }

  const entries = Object.entries(params).filter(
    (_entry): _entry is [string, string | number | boolean] => _entry[1] !== undefined && _entry[1] !== null
  );

  if (entries.length === 0) {
    return "";
  }

  return `?${entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&")}`;
}

async function parseResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    return rawText;
  }
}

export function getApiErrorCode(error: unknown): string | undefined {
  const envelope = getApiErrorEnvelope(error);
  if (typeof envelope?.error === "string") {
    return envelope.error;
  }

  return envelope?.error?.code;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  const envelope = getApiErrorEnvelope(error);
  if (typeof envelope?.error === "string") {
    return envelope.error;
  }

  return envelope?.error?.message;
}

export function getApiErrorDetails(error: unknown): Record<string, unknown> | undefined {
  const envelope = getApiErrorEnvelope(error);
  if (!envelope || typeof envelope.error === "string") {
    return undefined;
  }

  return envelope.error?.details;
}

function getApiErrorEnvelope(error: unknown): ApiErrorEnvelope | undefined {
  const responseData = (
    error as {
      response?: { data?: ApiErrorEnvelope };
    }
  )?.response?.data;

  return responseData;
}

const api = new ApiClient();

export default api;
