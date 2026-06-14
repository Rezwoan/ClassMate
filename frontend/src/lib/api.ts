const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

const ACCESS_KEY = "cm_access";
const REFRESH_KEY = "cm_refresh";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const tokens = {
  get access() {
    return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

function extractMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    const m = (body as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
  }
  return `Request failed (${status})`;
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refresh = tokens.refresh;
  if (!refresh) return false;
  if (!refreshing) {
    refreshing = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    })
      .then(async (res) => {
        if (!res.ok) return false;
        const data = (await res.json()) as {
          accessToken: string;
          refreshToken: string;
        };
        tokens.set(data.accessToken, data.refreshToken);
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean; // default true
  retry?: boolean; // internal
}

export async function api<T = unknown>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, auth = true, retry = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && tokens.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    const ok = await tryRefresh();
    if (ok) return api<T>(path, { ...opts, retry: false });
    tokens.clear();
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractMessage(data, res.status));
  }
  return data as T;
}

/** Multipart upload (FormData). Lets the browser set the multipart boundary. */
export async function apiUpload<T = unknown>(
  path: string,
  formData: FormData,
  opts: { retry?: boolean } = {},
): Promise<T> {
  const { retry = true } = opts;
  const headers: Record<string, string> = {};
  if (tokens.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (res.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return apiUpload<T>(path, formData, { retry: false });
    tokens.clear();
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, extractMessage(data, res.status));
  return data as T;
}

/** Fetches a protected binary resource (e.g. a note image) with auth. */
export async function apiBlob(
  path: string,
  opts: { retry?: boolean } = {},
): Promise<Blob> {
  const { retry = true } = opts;
  const headers: Record<string, string> = {};
  if (tokens.access) headers["Authorization"] = `Bearer ${tokens.access}`;

  const res = await fetch(`${API_URL}/api${path}`, { headers });

  if (res.status === 401 && retry) {
    const ok = await tryRefresh();
    if (ok) return apiBlob(path, { retry: false });
    tokens.clear();
  }

  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
  return res.blob();
}
