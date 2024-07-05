import { getCollection } from "astro:content";

export const events = (await getCollection("event")).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime(),
);

export const posts = (
  await getCollection("post", (post) => post.data.publish)
).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

export const pubs = (await getCollection("pub")).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime(),
);

export const links = [
  {
    text: "GitHub",
    href: "https://github.com/namachan10777",
    icon: "iconoir:github",
  },
  {
    text: "X",
    href: "https://x.com/namachan10777",
    icon: "iconoir:x",
  },
  {
    text: "Post",
    href: "/post/page/1",
    icon: "iconoir:post",
  },
];
