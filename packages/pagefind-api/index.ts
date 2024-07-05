export interface ResultDetail {
  url: string;
  content: string;
  excerpt: string;
  meta: Record<string, string> & { title: string };
}

export interface Result {
  id: string;
  data: () => Promise<ResultDetail>;
  score: number;
  words: number[];
}

export interface Found {
  results: Result[];
}

export interface Pagefind {
  init: () => Promise<void>;
  debouncedSearch: (query: string) => Promise<Found | null>;
}

export async function loadPagefind(path: string): Promise<Pagefind> {
  const mod = await import(
    /* @vite-ignore */
    `${path}`
  );
  return mod;
}
