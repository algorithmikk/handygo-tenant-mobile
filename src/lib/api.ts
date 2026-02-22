import * as SecureStore from 'expo-secure-store';

// Use ALB URL directly with Host header until api.handygo.ae domain is set up
const ALB_URL = 'http://umameats-api-alb-1654146811.us-east-1.elb.amazonaws.com/api/v1';
const HOST_HEADER = 'api.handygo.ae';

async function getHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Host': HOST_HEADER,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Add X-User-Id header from stored user for backend write operations
  try {
    const userJson = await SecureStore.getItemAsync('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user?.id) headers['X-User-Id'] = user.id;
    }
  } catch { /* ignore */ }
  return headers;
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${ALB_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path} failed: ${res.status} ${text}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: any) => request<T>('POST', path, body),
  put: <T>(path: string, body?: any) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: any) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

