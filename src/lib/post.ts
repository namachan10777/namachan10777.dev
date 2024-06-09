import { getCollection } from "astro:content";

export async function postYears(): Promise<string[]> {
  const posts = await getCollection("post");
  const years = new Set(
    posts.map((post) => {
      const year = /(\d{4})\/(.+)/.exec(post.slug)![1]!;
      return year;
    }),
  );
  return [...years.values()];
}
