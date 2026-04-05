import type { DocumentHead } from "@qwik.dev/router";
import type * as posts from "~/generated/posts/posts";

export function buildPostHead(
  post: posts.BodyDocument,
  params: Readonly<Record<string, string>>,
  url: URL,
): ReturnType<Extract<DocumentHead, (...args: any[]) => any>> {
  const meta = [
    {
      name: "description",
      content: post.frontmatter.description,
    },
    {
      property: "og:title",
      content: post.frontmatter.title,
    },
    {
      property: "og:type",
      content: "article",
    },
    {
      property: "og:url",
      content: `${url.origin}/post/${params.id}`,
    },
    {
      property: "og:description",
      content: post.frontmatter.description,
    },
    {
      property: "og:locale",
      content: "ja_JP",
    },
  ];
  if (post.frontmatter.og_image) {
    const og = post.frontmatter.og_image;
    meta.push({
      property: "og:image",
      content: `${url.origin}/image?bucket=${og.pointer.bucket}?key=${og.pointer.key}?format=webp`,
    });
  }
  return {
    title: post.frontmatter.title,
    meta,
  };
}
