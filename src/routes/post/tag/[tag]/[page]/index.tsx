import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { PaginatedPostList } from "~/components/paginated-post-list";
import { frontmatters, paginate } from "~/lib/contents";

export const usePostsPages = routeLoader$(({ params }) => {
  const pages = paginate(
    frontmatters.filter(
      (post) =>
        post.frontmatter.tags.includes(params.tag) && post.frontmatter.publish,
    ),
    16,
  );
  const index = parseInt(params.page, 10);
  const page = pages[index - 1];
  return page;
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
  return (
    <PaginatedPostList
      contents={page.value.contents.map((post) => ({
        id: post.id,
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        published: new Date(post.frontmatter.date),
        tags: post.frontmatter.tags,
      }))}
      prev={page.value.prev ? `/post/page/${page.value.prev}` : undefined}
      next={page.value.next ? `/post/page/${page.value.next}` : undefined}
    >
      <h1>Post ({page.value.current})</h1>
    </PaginatedPostList>
  );
});
