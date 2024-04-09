import { NumberLiteralType } from "typescript";

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

export type Options = {
  baseUrl?: string;
  bundlePath?: string;
  excerptLength?: number;
  highlightParam?: "highlight";
};

export interface PagefindApi {
  init: () => Promise<void>;
  search: (word: string, option?: SearchOption) => Promise<SearchResponse>;
  options: (options: Options) => Promise<void>;
  debouncedSearch: (
    word: string,
    option?: SearchOption,
    debounceTimeMillis?: number,
  ) => Promise<SearchResponse | null>;
}

export async function loadPagefind(): Promise<PagefindApi> {
  return (await import("/pagefind/pagefind.js?url")) as unknown as PagefindApi;
}

export class Pagefind {
  private api: PagefindApi | null = null;
  private readonly debounceDuration: number;
  private lastCallTime: number;
  private timeoutHandler: NodeJS.Timeout | null;
  constructor(debounceDuration?: number) {
    this.debounceDuration = debounceDuration || 300;
    this.lastCallTime = Date.now();
    this.timeoutHandler = null;
    loadPagefind().then((api) => {
      this.api = api;
    });
  }

  debouncedSearch(
    callback: (response: SearchResponse) => void,
    word: string,
    option?: SearchOption,
  ) {
    const now = Date.now();
    if (this.lastCallTime - now > this.debounceDuration) {
      this.lastCallTime = now;
      if (this.api) {
        this.api.search(word, option).then((response) => callback(response));
      }
    } else {
      if (this.timeoutHandler) {
        clearTimeout(this.timeoutHandler);
        this.timeoutHandler = null;
      }
      this.timeoutHandler = setTimeout(() => {
        if (this.api) {
          this.api.search(word, option).then((response) => callback(response));
        }
      }, this.debounceDuration);
    }
  }
}
