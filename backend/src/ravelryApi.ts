import axios from 'axios';

const API_BASE = 'https://api.ravelry.com';

export type RavelrySession = {
  username?: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
};

export function makeRavelryApi(args: { session: RavelrySession }) {
  async function getJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = `${API_BASE}${path}`;

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${args.session.accessToken}`,
        Accept: 'application/json',
      },
      params,
    });

    return res.data as T;
  }

  return {
    getJson,
  };
}

export type RavelryProjectListItem = {
  id: number;
  name?: string;
  completed?: string; // ISO-ish string
  started?: string;
  craft_name?: string;
  pattern_name?: string;
  permalink?: string;
};

export type RavelryProjectsListResponse = {
  projects: RavelryProjectListItem[];
  pagination?: { page: number; pages: number; page_size: number; results: number };
};

export type RavelryCurrentUserResponse = {
  user: { username: string };
};

/** Bundle list item (bundles_list). */
export type RavelryBundleListItem = {
  id: number;
  name?: string;
  pattern_count?: number;
};

export type RavelryBundlesListResponse = {
  bundles?: RavelryBundleListItem[];
};

/** Bundle show (bundles_show). Bundle contains bundle_items with pattern references. */
export type RavelryBundleItem = {
  id: number;
  pattern_id?: number;
  pattern?: { id: number; name?: string; permalink?: string };
};

export type RavelryBundleShowResponse = {
  bundle?: {
    id: number;
    name?: string;
    bundle_items?: RavelryBundleItem[];
  };
};
