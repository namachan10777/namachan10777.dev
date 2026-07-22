import type { MetaDescriptor } from "react-router";
import type * as posts from "~/generated/posts/posts";

export function buildPostHead(
  post: posts.BodyDocument,
  id: string,
  url: URL,
): MetaDescriptor[] {
  const meta: MetaDescriptor[] = [
    { title: post.frontmatter.title },
    { name: "description", content: post.frontmatter.description },
    { property: "og:title", content: post.frontmatter.title },
    { property: "og:type", content: "article" },
    { property: "og:url", content: `${url.origin}/post/${id}` },
    { property: "og:description", content: post.frontmatter.description },
    { property: "og:locale", content: "ja_JP" },
  ];
  if (post.frontmatter.og_image) {
    meta.push({
      property: "og:image",
      content: `${url.origin}/${post.frontmatter.og_image.pointer.key}?width=1200&format=webp`,
    });
  }
  return meta;
}
