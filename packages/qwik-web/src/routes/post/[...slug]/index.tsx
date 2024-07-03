import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { post as posts } from "#site/content";
import Markdown from "~/components/md";

export const usePost = routeLoader$(async (event) => {
  return posts.find((post) => post.slug === event.params.slug);
});

export default component$(() => {
  const post = usePost();
  if (post.value) {
    return <Markdown root={post.value.content} />;
  } else {
    return <article></article>;
  }
});

export const onStaticSiteGenerate: StaticGenerateHandler = async () => {
  return {
    params: posts.map((post) => ({
      slug: post.slug,
    })),
  };
};
