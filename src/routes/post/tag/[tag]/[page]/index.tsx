import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { PaginatedPostList } from "~/components/paginated-post-list";
import { frontmatters, paginate } from "~/lib/contents";
import styles from "./index.module.css";
import { NotFound } from "~/components/not-found";

export const usePostsPages = routeLoader$(({ params, status }) => {
  const pages = paginate(
    frontmatters.filter(
      (post) =>
        post.frontmatter.tags.includes(params.tag) && post.frontmatter.publish,
    ),
    16,
  );
  const index = parseInt(params.page, 10);
  if (index < 1 || index > pages.length) {
    status(404);
    return undefined;
  } else {
    const page = pages[index - 1];
    return { page, tag: params.tag };
  }
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  const tags = new Set(frontmatters.flatMap((post) => post.frontmatter.tags));
  const params = [...tags.values()].flatMap((tag) => {
    const pages = paginate(
      frontmatters.filter((post) => post.frontmatter.tags.includes(tag)),
      16,
    );
    return pages.map((page) => ({
      tag,
      page: page.current.toString(),
    }));
  });
  return { params };
};

export default component$(() => {
  const page = usePostsPages();
  if (!page.value) {
    return <NotFound />;
  }
  return (
    <PaginatedPostList
      contents={page.value.page.contents.map((post) => ({
        id: post.id,
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        published: new Date(post.frontmatter.date),
        tags: post.frontmatter.tags,
      }))}
      prev={
        page.value.page.prev ? `/post/page/${page.value.page.prev}` : undefined
      }
      next={
        page.value.page.next ? `/post/page/${page.value.page.next}` : undefined
      }
    >
      <h1>
        Post <span class={styles.tagInHeading}>#{page.value.tag}</span> (
        {page.value.page.current})
      </h1>
    </PaginatedPostList>
  );
});
