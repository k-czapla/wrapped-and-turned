import { getEnv } from './env.js';
import { app, ravelryEnabled } from './app.js';
import { STAT_PREFERENCE_KEYS, type StatPreferenceKey, type StatPreferences } from './session-types.js';

export { STAT_PREFERENCE_KEYS, type StatPreferenceKey, type StatPreferences };

const env = getEnv();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] listening on http://localhost:${env.PORT} (ravelryEnabled=${ravelryEnabled})`);
});
