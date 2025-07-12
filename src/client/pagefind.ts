export type Anchor = {
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  id: string;
  text: string;
  location: number;
};

export type WeightedLocation = {
  weight: number;
  balanced_score: number;
  location: number;
};

export type SubResult = {
  excerpt: string;
  locations: number[];
  title: string;
  url: string;
  weighted_locations: WeightedLocation[];
};

export type Data = {
  url: string;
  content: string;
  word_count: number;
  anchors: Anchor[];
  excerpt: string;
  filters: Filters;
  locations: number[];
  meta: Record<string, string> & { title: string };
  raw_content: string;
  raw_url: string;
  sub_results: SubResult[];
  weighted_locations: WeightedLocation[];
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
  results: SearchResult[];
  filters: Filters;
  timings: Timing[];
  totalFilters: Filters;
  unfilteredResultCount: number;
};

export type SearchOptions = {
  filters?: Filters;
};

export type Filters = CombinedFilter | SimpleFilter;

export type SimpleFilter = Record<string, string | string[] | CombinedFilter>;

export type CombinedFilter =
  | {
      all: SimpleFilter | SimpleFilter[];
      not?: SimpleFilter | SimpleFilter[];
      any?: SimpleFilter | SimpleFilter[];
      none?: SimpleFilter | SimpleFilter[];
    }
  | {
      all?: SimpleFilter | SimpleFilter[];
      not: SimpleFilter | SimpleFilter[];
      any?: SimpleFilter | SimpleFilter[];
      none?: SimpleFilter | SimpleFilter[];
    }
  | {
      all?: SimpleFilter | SimpleFilter[];
      not?: SimpleFilter | SimpleFilter[];
      any: SimpleFilter | SimpleFilter[];
      none?: SimpleFilter | SimpleFilter[];
    }
  | {
      all?: SimpleFilter | SimpleFilter[];
      not?: SimpleFilter | SimpleFilter[];
      any?: SimpleFilter | SimpleFilter[];
      none: SimpleFilter | SimpleFilter[];
    };

export type RankingOptions = {
  pageLength?: number;
  termFrequency?: number;
  termSaturation?: number;
};

export type Options = {
  baseUrl?: string;
  bundlePath?: string;
  excerptLength?: number;
  highlightParam?: string;
  ranking?: RankingOptions;
  indexWeight?: number;
  mergeFilter?: Filters;
};

export type AvailableFilters = Record<string, Record<string, number>>;

export interface Pagefind {
  debouncedSearch(
    query: string,
    options: SearchOptions,
    duration: number
  ): Promise<SearchResponse | null>;
  destroy(): Promise<void>;
  init(): Promise<void>;
  filters(): Promise<AvailableFilters>;
  mergeIndex(url: string, options?: Options & { language?: string }): Promise<void>;
  options(options: Options): Promise<void>;
  preload(query: string, options?: SearchOptions): Promise<void>;
  search(query: string, options: SearchOptions): Promise<SearchResponse>;
}
