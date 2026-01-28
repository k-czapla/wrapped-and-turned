import crypto from 'node:crypto';
import axios from 'axios';

const AUTH_URL = 'https://www.ravelry.com/oauth2/auth';
const TOKEN_URL = 'https://www.ravelry.com/oauth2/token';

export type OAuth2TokenSet = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
  scope?: string;
  tokenType?: string;
};

export function buildAuthorizeUrl(args: {
  clientId: string;
  redirectUri: string;
  scope?: string;
  state: string;
}) {
  const u = new URL(AUTH_URL);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', args.clientId);
  u.searchParams.set('redirect_uri', args.redirectUri);
  if (args.scope) u.searchParams.set('scope', args.scope);
  u.searchParams.set('state', args.state);
  return u.toString();
}

export function makeState() {
  return crypto.randomBytes(16).toString('hex');
}

function basicAuthHeader(clientId: string, clientSecret: string) {
  const token = Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

export async function exchangeCodeForToken(args: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<OAuth2TokenSet> {
  const res = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code: args.code,
      redirect_uri: args.redirectUri,
    }),
    {
      headers: {
        Authorization: basicAuthHeader(args.clientId, args.clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    }
  );

  const data = res.data as {
    access_token: string;
    token_type?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 24 * 60 * 60;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: data.scope,
    tokenType: data.token_type,
  };
}

export async function refreshAccessToken(args: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<OAuth2TokenSet> {
  const res = await axios.post(
    TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: args.refreshToken,
    }),
    {
      headers: {
        Authorization: basicAuthHeader(args.clientId, args.clientSecret),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    }
  );

  const data = res.data as {
    access_token: string;
    token_type?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 24 * 60 * 60;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? args.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: data.scope,
    tokenType: data.token_type,
  };
}
