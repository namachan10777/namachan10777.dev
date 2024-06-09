import {
  getCollection,
  type CollectionEntry,
  type CollectionKey,
} from "astro:content";

export async function paginated<K extends CollectionKey>(
  key: K,
  pageSize: number,
): Promise<CollectionEntry<K>[][]> {
  const posts = await getCollection(key);
  const indices = Array.from(
    { length: Math.ceil(posts.length / pageSize) },
    (_, index) => index,
  );
  return indices.map((index) =>
    posts.slice(
      index * pageSize,
      Math.min((index + 1) * pageSize, posts.length),
    ),
  );
}
