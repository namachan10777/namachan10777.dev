import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import BlogHeadingLong from "~/components/composite/blog-heading-long";
import { ogMetaTags } from "~/lib/og-meta-tags";

export default component$(() => {
  return (
    <nav>
      <ul class="flex flex-col gap-8">
        {allBlogs
          .filter((blog) => blog.publish)
          .map((blog) => (
            <li key={blog._meta.path}>
              <BlogHeadingLong blog={blog} limit={160} />
            </li>
          ))}
      </ul>
    </nav>
  );
});

export const head: DocumentHead = ({ url }) => ({
  title: "Blog",
  meta: [
    {
      name: "description",
      content: "ブログ記事一覧",
    },
    ...ogMetaTags({
      title: "Blog",
      description: "ブログ記事一覧",
      imgUrl: `${url}og.webp`,
      type: "website",
      twitter: {
        imgType: "summary_large_image",
        username: "namachan10777",
      },
    }),
  ],
});
