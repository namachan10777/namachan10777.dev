import { type RequestHandler } from "@builder.io/qwik-city";
import { XMLBuilder } from "fast-xml-parser";
import { frontmatters } from "~/lib/contents";

interface RssItem {
  title: string;
  description: string;
  link: string;
  date: Date;
  categories: string[];
}

interface RssProps {
  title: string;
  description: string;
  link: string;
  items: RssItem[];
  language: string;
}

function genRss(rss: RssProps): string {
  const builder = new XMLBuilder({
    attributeNamePrefix: "@",
    ignoreAttributes: false,
  });
  const obj = {
    "?xml": {
      "@version": "1.0",
      "@encoding": "UTF-8",
    },
    rss: {
      "@version": "2.0",
      channel: {
        title: rss.title,
        link: rss.link,
        description: rss.description,
        language: rss.language,
        item: rss.items.map((item) => ({
          title: item.title,
          link: item.link,
          description: item.description,
          pubDate: item.date.toISOString(),
          category: item.categories.join(","),
        })),
      },
    },
  };
  return builder.build(obj);
}

export const onGet: RequestHandler = async ({ request, send }) => {
  const url = new URL(request.url);
  const xml = genRss({
    title: "namachan10777.dev",
    description: "namachan10777's personal website and blog",
    link: url.origin,
    language: "ja",
    items: frontmatters.map((post) => ({
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      date: new Date(post.frontmatter.date),
      link: `${url.origin}/post/${post.id}/`,
      categories: post.frontmatter.tags,
    })),
  });
  send(200, xml);
};
