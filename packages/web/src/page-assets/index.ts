import { getCollection } from "astro:content";

export const events = (await getCollection("event")).sort(
  (a, b) => b.data.date.getTime() - a.data.date.getTime(),
);

interface WithDateEntry {
  data: {
    date: Date;
  };
}

function sortByDate<A extends WithDateEntry, B extends WithDateEntry>(
  a: A | undefined,
  b: B | undefined,
) {
  if (a && b) {
    return b.data.date.getTime() - a.data.date.getTime();
  } else {
    return 0;
  }
}

export const posts = (
  await getCollection("post", (post) => post.data.publish)
).sort(sortByDate);

export const pubs = (await getCollection("pub")).sort(sortByDate);

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
