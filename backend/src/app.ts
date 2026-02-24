import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { createAuth } from './auth.js';
import { getEnv } from './env.js';
import './session-types.js';
import type { RouteContext } from './routes/context.js';
import { createApiRouter } from './routes/api/index.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerHealthRoutes } from './routes/health.js';

const env = getEnv();
const ravelryEnabled =
  !env.MOCK_RAVELRY && !!env.RAVELRY_CLIENT_ID && !!env.RAVELRY_CLIENT_SECRET;

const app = express();
app.use(express.json());

// Render (and most managed hosts) run behind a proxy. Trusting it ensures:
// - req.protocol reflects HTTPS (when configured)
// - secure cookies work correctly
const isProd = env.FRONTEND_URL.startsWith('https://');
if (isProd) {
  app.set('trust proxy', 1);
}

const isCrossSite =
  !!env.PUBLIC_BACKEND_URL &&
  new URL(env.PUBLIC_BACKEND_URL).origin !== new URL(env.FRONTEND_URL).origin;

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // If frontend and backend are on different origins (common on Render),
      // session cookies must be SameSite=None and Secure to be sent on XHR/fetch.
      sameSite: isCrossSite ? 'none' : 'lax',
      secure: isCrossSite || isProd,
    },
  })
);

const auth = createAuth(env, ravelryEnabled);
const ctx: RouteContext = { env, ravelryEnabled, auth };

registerHealthRoutes(app, ctx);
registerAuthRoutes(app, ctx);
app.use('/api', createApiRouter(ctx));

export { app, ravelryEnabled };
