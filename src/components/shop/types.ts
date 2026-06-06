/**
 * Shared types for the external supplier catalog (legoroom.ge etc.).
 *
 * The backend field names are isolated behind mapCatalogProduct so a rename
 * touches exactly one place. Prices arrive in minor units (tetri) and are
 * converted to GEL once, here.
 */

/** Raw shape from GET /supplier-catalog/products. */
export interface CatalogProductDto {
  /** Mongo docs serialize as `_id`; some paths also expose `id`. */
  id?: string;
  _id?: string;
  externalId: string;
  supplierKey: string;
  name: string;
  nameKa?: string;
  priceMinor: number;
  currency: string;
  imageUrl?: string;
  imageUrls?: string[];
  externalUrl: string;
  category?: string;
  categoryLabel?: string;
  isAvailable: boolean;
  /** undefined = the shop doesn't expose stock (unknown). */
  inStock?: boolean;
}

/** Normalized shape used across the UI. */
export interface CatalogProduct {
  id: string;
  supplierKey: string;
  name: string;
  nameKa?: string;
  /** Major units (GEL). */
  priceGel: number;
  currency: string;
  imageUrl?: string;
  imageUrls?: string[];
  externalUrl: string;
  category?: string;
  categoryLabel?: string;
  isAvailable: boolean;
  inStock?: boolean;
}

/** A category facet row from GET /supplier-catalog/categories. */
export interface CatalogCategoryFacet {
  category: string;
  categoryLabel?: string;
  count: number;
}

/** A shop row from GET /supplier-catalog/suppliers. */
export interface CatalogSupplier {
  key: string;
  name: string;
  productCount: number;
}

export interface CatalogSearchResponse {
  items: CatalogProductDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export function mapCatalogProduct(d: CatalogProductDto): CatalogProduct {
  return {
    // The API serializes Mongo `_id`; `id` is absent on the list path, so all
    // products would otherwise share an undefined id (cart/key collisions).
    id: d.id || d._id || d.externalId,
    supplierKey: d.supplierKey,
    name: d.name,
    nameKa: d.nameKa,
    priceGel: (d.priceMinor || 0) / 100,
    currency: d.currency || 'GEL',
    imageUrl: d.imageUrl,
    imageUrls: d.imageUrls,
    externalUrl: d.externalUrl,
    category: d.category,
    categoryLabel: d.categoryLabel,
    isAvailable: d.isAvailable,
    inStock: d.inStock,
  };
}

const SUPPLIER_LABELS: Record<string, string> = {
  legoroom: 'Legoroom',
  imart: 'iMart',
  gorgia: 'Gorgia',
  goodbuild: 'GoodBuild',
  nova: 'Nova',
  comforter: 'Comforter',
  classica: 'Classica',
  ashleyhome: 'Ashley Home',
  thermocenter: 'Thermocenter',
  mosaics: 'Mosaics',
  vitra: 'VitrA',
  homevision: 'Home Vision',
  qebuli: 'Qebuli Climate',
  maxtherm: 'Maxtherm',
  cavoli: 'Cavoli',
  contempo: 'Contempo',
  domino: 'Domino',
};

export function supplierLabel(key: string): string {
  return SUPPLIER_LABELS[key] || (key ? key[0].toUpperCase() + key.slice(1) : '');
}

// Shop domains (verified against each supplier's real product URLs), used to
// fetch a favicon as the supplier "logo". Unknown suppliers fall back to a
// monogram (see SupplierAvatar).
const SUPPLIER_DOMAINS: Record<string, string> = {
  ashleyhome: 'ashleyhome.ge',
  classica: 'classica.com.ge',
  comforter: 'comforter.ge',
  goodbuild: 'goodbuild.ge',
  gorgia: 'gorgia.ge',
  homevision: 'homevision.ge',
  legoroom: 'legoroom.ge',
  maxtherm: 'maxtherm.ge',
  mosaics: 'mosaics.ge',
  nova: 'nova.ge',
  qebuli: 'qebuli-climate.ge',
  thermocenter: 'thermocenter.ge',
  vitra: 'vitra.com.ge',
  imart: 'imart.ge',
  cavoli: 'cavoligeorgia.ge',
  contempo: 'contempo.ge',
  domino: 'domino.ge',
};

const faviconUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

/** A favicon URL for the supplier's shop, or undefined when domain unknown. */
export function supplierLogo(key: string): string | undefined {
  const domain = SUPPLIER_DOMAINS[key];
  return domain ? faviconUrl(domain) : undefined;
}

// Official logo files for shops we have proper assets for. Drop a file in
// `frontend/public/logos/` and map it here - it takes priority over the
// favicon and renders full-size + razor-sharp at any tile size (favicons cap
// out around 32px). Example: `legoroom: '/logos/legoroom.svg'`.
const SUPPLIER_LOGO_FILES: Record<string, string> = {};

/** A high-res logo file for the shop, when we have one bundled. */
export function supplierLogoFile(key?: string): string | undefined {
  return key ? SUPPLIER_LOGO_FILES[key] : undefined;
}

/**
 * Favicon derived straight from a product's external URL - always accurate,
 * even for suppliers not in the static map. Falls back to the map by key.
 */
export function supplierLogoFromUrl(
  url?: string,
  key?: string,
): string | undefined {
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      if (host) return faviconUrl(host);
    } catch {
      /* fall through to the key map */
    }
  }
  return key ? supplierLogo(key) : undefined;
}

// Some shops serve a generic placeholder (e.g. classica's bag.svg) for
// products without a photo. Treat those as "no image" so we show our own
// clean fallback instead of a random shopping-bag graphic.
const PLACEHOLDER_IMAGE_PATTERNS: RegExp[] = [
  /\/bag\.svg(\?|$)/i,
  /placeholder/i,
  /no[-_]?image/i,
  /noimage/i,
  /default[-_]?(product|image)/i,
];

/** True when the URL looks like a real product photo (not a placeholder). */
export function isRealProductImage(url?: string): boolean {
  if (!url) return false;
  return !PLACEHOLDER_IMAGE_PATTERNS.some((re) => re.test(url));
}

/** The fields handed back to the add-product form when a card is picked. */
export interface CatalogPrefill {
  name: string;
  unitPrice: number;
  vendor: string;
  url: string;
  imageUrl?: string;
}
