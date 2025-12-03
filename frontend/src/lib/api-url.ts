// Returns the correct API URL depending on execution context (server vs client)
export function getApiUrl(): string {
  // On the server (SSR), use internal Docker network URL if available
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5279/api';
  }
  // On the client (browser), use public URL
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5279/api';
}
