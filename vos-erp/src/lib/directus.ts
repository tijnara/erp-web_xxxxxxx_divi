import { createDirectus, rest, authentication, staticToken } from '@directus/sdk';

const baseURL = process.env.NEXT_PUBLIC_DIRECTUS_URL!;

export const directusServer = createDirectus(baseURL).with(rest()).with(authentication('json'));
export const directusPublic = createDirectus(baseURL).with(rest());

export const getDirectusClient = (token: string) => {
  return createDirectus(baseURL).with(rest()).with(staticToken(token));
};

// Helper: attach static token on server (do NOT use in client/browser)
export function withStaticToken<T>(client: T) {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) return client as T;
    // @ts-expect-error: set Authorization header on the underlying transport
    client.transport.defaults.headers = {
        ...(client as any).transport?.defaults?.headers,
        Authorization: `Bearer ${token}`,
    };
    return client as T;
}
