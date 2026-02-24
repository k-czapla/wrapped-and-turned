/** Prefer medium2_url when non-empty, else medium_url, small_url, thumbnail_url. */
export function ravelryPhotoUrl(ph: {
  medium2_url?: string;
  medium_url?: string;
  small_url?: string;
  thumbnail_url?: string;
} | null | undefined): string | undefined {
  if (!ph) return undefined;
  const url =
    ph.medium2_url?.trim()
      ? ph.medium2_url
      : ph.medium_url ?? ph.small_url ?? ph.thumbnail_url;
  return url ?? undefined;
}

/** Build a pattern card for Pattern Round Up from Ravelry pattern response. */
export function buildPatternCardFromRavelry(pat: any, patternId: number): Record<string, unknown> {
  const photos = Array.isArray(pat?.photos) ? pat.photos : [];
  const patternPhotos = photos.map((ph: any) => ravelryPhotoUrl(ph)).filter(Boolean);
  const firstPhoto = photos[0];
  const imageUrl = ravelryPhotoUrl(firstPhoto);

  const designerName =
    pat?.pattern_author?.name ?? pat?.designer?.name ?? undefined;
  const patternName = pat?.name ?? `Pattern #${patternId}`;

  // Prefer sizes_available from API (e.g. "13 sizes"); fall back to computed from sizes array
  const sizesAvailableFromApi =
    typeof pat?.sizes_available === 'string' && pat.sizes_available.trim()
      ? pat.sizes_available.trim()
      : undefined;
  const sizesArr = Array.isArray(pat?.sizes) ? pat.sizes : [];
  const sizeNames = sizesArr.map((s: any) => s?.name ?? s?.size).filter(Boolean);
  const minCm = sizesArr.reduce(
    (acc: number | null, s: any) => {
      const v = s?.min_circumference_cm ?? s?.min_circumference;
      const n = typeof v === 'number' ? v : null;
      return n != null && (acc == null || n < acc) ? n : acc;
    },
    null as number | null
  );
  const maxCm = sizesArr.reduce(
    (acc: number | null, s: any) => {
      const v = s?.max_circumference_cm ?? s?.max_circumference;
      const n = typeof v === 'number' ? v : null;
      return n != null && (acc == null || n > acc) ? n : acc;
    },
    null as number | null
  );
  let sizesAvailable = sizesAvailableFromApi;
  if (!sizesAvailable) {
    sizesAvailable = sizeNames.length ? sizeNames.join(', ') : undefined;
    if (minCm != null || maxCm != null) {
      const minM = minCm != null ? (minCm / 100).toFixed(2) : '?';
      const maxM = maxCm != null ? (maxCm / 100).toFixed(2) : '?';
      const range = minCm != null && maxCm != null ? `${minM}–${maxM} m` : minCm != null ? `≥${minM} m` : `≤${maxM} m`;
      sizesAvailable = sizesAvailable ? `${sizesAvailable} (${range})` : range + ' circumference';
    }
  }

  const needleArr = pat?.needle_sizes ?? pat?.pattern_needle_sizes ?? [];
  const needleSizes = Array.isArray(needleArr)
    ? [...new Set(
        needleArr
          .map((n: any) => {
            const metric = n?.metric ?? n?.mm;
            const us = n?.us ?? n?.us_steel ?? n?.hook;
            const name = n?.name ?? n?.pretty_metric;
            if (typeof metric === 'number' && metric > 0) return `${metric}mm`;
            if (typeof us !== 'undefined' && us !== null) return `US ${us}`;
            if (typeof name === 'string' && name.trim()) return name.trim();
            return null;
          })
          .filter(Boolean)
      )].join(' + ') || undefined
    : undefined;

  const gauge =
    typeof pat?.gauge === 'string' && pat.gauge.trim()
      ? pat.gauge.trim()
      : pat?.gauge_description?.trim() ?? undefined;

  // Prefer yarn_name from packs (e.g. "De Rerum Natura Bérénice"); fall back to yarn_weight
  const packs = Array.isArray(pat?.packs) ? pat.packs : [];
  const yarnNamesFromPacks = packs
    .map((p: any) => (typeof p?.yarn_name === 'string' && p.yarn_name.trim() ? p.yarn_name.trim() : null))
    .filter(Boolean);
  const suggestedYarnFromPacks =
    yarnNamesFromPacks.length > 0 ? [...new Set(yarnNamesFromPacks)].join(', ') : undefined;
  let suggestedYarn: string | undefined = suggestedYarnFromPacks;
  if (!suggestedYarn) {
    const yarnWeights = pat?.yarn_weight ?? pat?.pattern_yarn_weights;
    if (Array.isArray(yarnWeights) && yarnWeights.length > 0) {
      suggestedYarn = yarnWeights
        .map((y: any) => y?.name ?? y?.min_gauge ?? y?.ply ?? '')
        .filter(Boolean)
        .join(', ');
    } else if (yarnWeights && typeof yarnWeights === 'object' && yarnWeights.name) {
      suggestedYarn = String(yarnWeights.name);
    }
  }

  const permalink = pat?.permalink;
  const patternUrl =
    typeof permalink === 'string' && permalink
      ? `https://www.ravelry.com/patterns/library/${permalink}`
      : `https://www.ravelry.com/patterns/library/${patternId}`;

  const price =
    typeof pat?.price === 'number' && Number.isFinite(pat.price) ? pat.price : undefined;
  const currency =
    typeof pat?.currency === 'string' && pat.currency.trim() ? pat.currency.trim() : undefined;

  return {
    id: patternId,
    imageUrl,
    patternPhotos: patternPhotos.length ? patternPhotos : undefined,
    patternName,
    designerName,
    sizesAvailable: sizesAvailable ?? undefined,
    needleSizes,
    gauge,
    suggestedYarn,
    patternUrl,
    ...(price != null && { price }),
    ...(currency && { currency }),
  };
}

/** Extract item array from bundle. Ravelry returns bundled_items (array of BundledItem). */
export function extractBundleItems(bundle: Record<string, unknown>): unknown[] {
  const direct = bundle.bundled_items ?? bundle.bundle_items ?? bundle.items;
  if (Array.isArray(direct)) return direct;
  if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
    const paginated = direct as Record<string, unknown>;
    const list = paginated.item ?? paginated.items ?? paginated.bundled_items ?? paginated.bundle_items;
    if (Array.isArray(list)) return list;
  }
  return [];
}

/** Get pattern id from a bundle item; Ravelry may use item_id (Pattern), pattern_id, pattern.id, or nested pattern. */
export function getPatternIdFromBundleItem(item: Record<string, unknown>): number | undefined {
  const pid = item.pattern_id;
  if (typeof pid === 'number' && Number.isFinite(pid)) return pid;
  const pattern = item.pattern;
  if (pattern && typeof pattern === 'object' && pattern !== null) {
    const p = pattern as Record<string, unknown>;
    const id = p.id ?? p.pattern_id;
    if (typeof id === 'number' && Number.isFinite(id)) return id;
  }
  const craftPattern = item.craft_pattern;
  if (craftPattern && typeof craftPattern === 'object' && craftPattern !== null) {
    const cp = craftPattern as Record<string, unknown>;
    const id = cp.id ?? cp.pattern_id;
    if (typeof id === 'number' && Number.isFinite(id)) return id;
  }
  // Ravelry bundles_show: bundled_items[].item_id is the pattern id when item_type === 'Pattern'
  const itemId = item.item_id;
  if (typeof itemId === 'number' && Number.isFinite(itemId)) {
    const type = item.item_type;
    if (type === 'Pattern' || type === undefined) return itemId;
  }
  // Embedded bookmark.favorited (pattern object) when item is a pattern bookmark
  const bookmark = item.bookmark;
  if (bookmark && typeof bookmark === 'object' && bookmark !== null) {
    const fav = (bookmark as Record<string, unknown>).favorited;
    if (fav && typeof fav === 'object' && fav !== null) {
      const f = fav as Record<string, unknown>;
      const id = f.id ?? f.pattern_id;
      if (typeof id === 'number' && Number.isFinite(id)) return id;
    }
  }
  return undefined;
}

/** Get embedded pattern from a bundle item when Ravelry returns bookmark.favorited (e.g. bundles_show). */
export function getEmbeddedPatternFromBundleItem(item: Record<string, unknown>): Record<string, unknown> | null {
  const bookmark = item.bookmark;
  if (!bookmark || typeof bookmark !== 'object' || bookmark === null) return null;
  const fav = (bookmark as Record<string, unknown>).favorited;
  if (!fav || typeof fav !== 'object' || fav === null) return null;
  const f = fav as Record<string, unknown>;
  if (f.id == null && f.name == null) return null;
  // Normalize for buildPatternCardFromRavelry: it expects pat.photos array; bundle gives first_photo
  const firstPhoto = f.first_photo;
  const photos = firstPhoto && typeof firstPhoto === 'object' ? [firstPhoto] : [];
  return { ...f, photos };
}
