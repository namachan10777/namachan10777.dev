export type FilterValue = number | string;

export type AttributeCondition =
  | {
      any: FilterValue[];
    }
  | {
      all: FilterValue[];
    }
  | {
      not: FilterValue[];
    }
  | {
      none: FilterValue[];
    }
  | FilterValue
  | FilterValue[];

export type AttributeFilter = Record<string, AttributeCondition>;

export type CombinedFilter = {
  all?: AttributeFilter | AttributeFilter[];
  not?: AttributeFilter | AttributeFilter[];
  any?: AttributeFilter | AttributeFilter[];
  none?: AttributeFilter | AttributeFilter[];
};

export type Filter = AttributeFilter | CombinedFilter;

export type SearchOption = {
  filters?: Filter;
};

export type Anchor = {
  element: string;
  id: string;
  location: number;
  text: string;
};

export type WeightedLocation = {
  weight: number;
  balanced_score: number;
  location: number;
};

export type SubResult = {
  excerpt: string;
  title: string;
  url: string;
  weighted_locations: WeightedLocation[];
};

export type Data = {
  anchors: Anchor[];
  content: string;
  excerpt: string;
  filters: Filter;
  locations: number[];
  meta: Record<string, string> & { title: string };
  raw_content: string;
  raw_url: string;
  sub_results: SubResult[];
  url: string;
  weighted_locations: WeightedLocation[];
  word_count: number;
};

export type SearchResult = {
  data: () => Promise<Data>;
  id: string;
  score: number;
  words: number[];
};

export type Timing = {
  preload: number;
  search: number;
  total: number;
};

export type SearchResponse = {
  filters: Filter;
  results: SearchResult[];
  timings: Timing[];
  totalFilters: Filter;
  unfilteredResultCount: number;
};

export interface PagefindApi {
  init: () => Promise<void>;
  search: (word: string, option?: SearchOption) => Promise<SearchResponse>;
  debouncedSearch: (
    word: String,
    option?: SearchOption,
    debounceTimeMillis?: number,
  ) => Promise<SearchResponse | null>;
}

export async function loadPagefind(): Promise<PagefindApi> {
  return (await import("/pagefind/pagefind.js?url")) as any as PagefindApi;
}
