import { RequestHandler } from "@builder.io/qwik-city";
import { allBlogs } from "content-collections";
import { Builder } from "xml2js";

function blog2xml(blog: (typeof allBlogs)[0]) {
  return {
    item: {
      title: blog.title,
      link: `https://www.namachan10777.dev/blog/${blog._meta.path}`,
      guid: {
        $: {
          isPermaLink: true,
        },
        _: `https://www.namachan10777.dev/blog/${blog._meta.path}`,
      },
      description: blog.description,
      pubDate: new Date(blog.date).toUTCString(),
    },
  };
}

function blogChannel() {
  return [
    {
      title: "namachan10777's blog",
    },
    {
      description: "分散システム、ストレージ、Web、あとそのほか",
    },
    {
      link: "https://www.namachan10777.dev",
    },
    {
      lastBuildDate: new Date().toUTCString(),
    },
    {
      language: "ja",
    },
    ...allBlogs.map(blog2xml),
  ];
}

function generateXmlAst() {
  return {
    rss: {
      $: {
        version: "2.0",
        "xmlns:atom": "http://www.w3.org/2005/Atom",
      },
      channel: [blogChannel()],
    },
  };
}

export const onGet: RequestHandler = async ({ send }) => {
  const builder = new Builder();
  const xml = builder.buildObject(generateXmlAst());
  send(200, xml);
};
