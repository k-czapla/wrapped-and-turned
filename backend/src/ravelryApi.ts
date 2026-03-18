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
  /** Ravelry list: e.g. "Finished", "In progress", "Hibernating", "Frogged" */
  status_name?: string;
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

/** BundledItem from Ravelry bundles_show. When logged in, items use item_id + item_type and embed pattern in bookmark.favorited. */
export type RavelryBundledItem = {
  id: number;
  pattern_id?: number;
  pattern?: { id: number; name?: string; permalink?: string };
  /** bundles_show (logged-in): pattern id for Pattern items */
  item_id?: number;
  item_type?: string;
  /** bundles_show (logged-in): embedded pattern object (id, name, permalink, first_photo, designer, pattern_author, pattern_sources) */
  bookmark?: { favorited?: Record<string, unknown> };
};

/** Bundle (full) from Ravelry bundles_show. Attributes: bundled_items, bundled_items_count, id, name, etc. */
export type RavelryBundleShowResponse = {
  bundle?: {
    id: number;
    name?: string;
    permalink?: string;
    bundled_items?: RavelryBundledItem[];
    bundled_items_count?: number;
  };
};
