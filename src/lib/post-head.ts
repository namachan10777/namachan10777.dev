import type { MetaDescriptor } from "react-router";
import type * as posts from "~/generated/posts/posts";
import { buildBlogPostingStructuredData } from "~/lib/structured-data";

interface PostTimestamps {
  createdAt: Date;
  updatedAt: Date;
}

export function buildPostHead(
  post: posts.BodyDocument,
  id: string,
  url: URL,
  timestamps: PostTimestamps,
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
  meta.push(
    buildBlogPostingStructuredData(url.origin, {
      id,
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
      tags: post.frontmatter.tags.map((record) => record.tag),
      imageKey: post.frontmatter.og_image?.pointer.key,
    }),
  );
  return meta;
}
