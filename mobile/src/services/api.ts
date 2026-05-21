import AsyncStorage from "@react-native-async-storage/async-storage";
import { resetToSignIn } from "../navigation/rootNavigation";
import { clearStudentAuthSession } from "./authSession";

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

const SESSION_EXPIRED_MESSAGE = "Session expired. Please sign in again.";
const STUDENT_AUTH_EXCLUDED_PATHS = new Set([
  "/auth/signin",
  "/auth/signup",
  "/auth/verify-email"
]);

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

class ApiNetworkError extends Error {
  public readonly causeError: unknown;

  public constructor(baseUrl: string, causeError: unknown) {
    super(
      `Cannot reach the InCampus backend at ${baseUrl}. Check EXPO_PUBLIC_API_BASE_URL and make sure this device can reach the backend.`
    );
    this.name = "ApiNetworkError";
    this.causeError = causeError;
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
    const baseUrl = getBaseUrl();
    const requestUrl = buildUrl(path, options?.params, baseUrl);
    let response: Response;

    try {
      response = await fetch(requestUrl, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });
    } catch (error) {
      throw new ApiNetworkError(baseUrl, error);
    }

    const responseData = await parseResponse(response);

    if (!response.ok) {
      if (response.status === 401 && shouldHandleStudentSessionExpiry(path, options?.headers)) {
        await clearStudentAuthSession();
        resetToSignIn();
        throw new ApiRequestError(response.status, responseData, SESSION_EXPIRED_MESSAGE);
      }

      throw new ApiRequestError(
        response.status,
        responseData,
        getApiErrorMessage({ response: { status: response.status, data: responseData } }) ??
          `Request failed with status ${response.status}`
      );
    }

    return {
      data: unwrapSuccessfulResponse(responseData) as T,
      status: response.status
    };
  }
}

function shouldHandleStudentSessionExpiry(path: string, headers?: Record<string, string>): boolean {
  const normalizedPath = normalizePath(path);
  if (STUDENT_AUTH_EXCLUDED_PATHS.has(normalizedPath)) {
    return false;
  }

  if (normalizedPath.startsWith("/admin/")) {
    return false;
  }

  return !containsAdminHeaders(headers);
}

function normalizePath(path: string): string {
  const pathOnly = path.split("?")[0] ?? path;
  return pathOnly.startsWith("/") ? pathOnly : `/${pathOnly}`;
}

function containsAdminHeaders(headers?: Record<string, string>): boolean {
  if (!headers) {
    return false;
  }

  return Object.keys(headers).some((key) => key.toLowerCase().startsWith("x-admin-"));
}

function getBaseUrl(): string {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

  return configuredBaseUrl || "http://localhost:3000";
}

function buildUrl(path: string, params?: ApiParams, baseUrl = getBaseUrl()): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");
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

function unwrapSuccessfulResponse(responseData: unknown): unknown {
  if (hasOwnDataProperty(responseData)) {
    return responseData.data;
  }

  return responseData;
}

function hasOwnDataProperty(value: unknown): value is { data: unknown } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(value, "data");
}

export function getApiErrorCode(error: unknown): string | undefined {
  const envelope = getApiErrorEnvelope(error);
  if (typeof envelope?.error === "string") {
    return envelope.error;
  }

  return envelope?.error?.code;
}

export function getApiErrorMessage(error: unknown): string | undefined {
  if (error instanceof ApiNetworkError) {
    return error.message;
  }

  if (error instanceof ApiRequestError && error.message === SESSION_EXPIRED_MESSAGE) {
    return error.message;
  }

  const envelope = getApiErrorEnvelope(error);
  if (typeof envelope?.error === "string") {
    return envelope.error;
  }

  return envelope?.error?.message ?? (error instanceof Error ? error.message : undefined);
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
