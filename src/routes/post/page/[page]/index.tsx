import { component$ } from "@builder.io/qwik";
import { StaticGenerateHandler, routeLoader$ } from "@builder.io/qwik-city";
import { frontmatters, paginate } from "~/lib/contents";

const pages = paginate(frontmatters, 16);

export const usePostsPages = routeLoader$(({ params }) => {
  const index = parseInt(params.page, 10);
  const page = pages[index - 1];
  return page;
});

export const onStaticGenerate: StaticGenerateHandler = () => {
  return {
    params: pages.map((page) => {
      return { page: page.current.toString() };
    }),
  };
};

export default component$(() => {
  const page = usePostsPages();
  return (
    <div>
      <h1>Post ({page.value.current})</h1>
      <ol>
        {page.value.contents.map((post) => (
          <li key={post.id}>
            <a href={`/post/${post.id}`}>{post.frontmatter.title}</a>
          </li>
        ))}
      </ol>
      <nav>
        {page.value.prev && <a href={`/post/page/${page.value.prev}`}>Prev</a>}
        {page.value.next && <a href={`/post/page/${page.value.next}`}>Next</a>}
      </nav>
    </div>
  );
});
