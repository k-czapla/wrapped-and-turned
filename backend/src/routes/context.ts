import type { Env } from '../env.js';
import type { AuthHelpers } from '../auth.js';

export interface RouteContext {
  env: Env;
  ravelryEnabled: boolean;
  auth: AuthHelpers;
}
