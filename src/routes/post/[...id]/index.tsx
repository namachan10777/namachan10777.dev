import { component$ } from "@builder.io/qwik";
import {
  StaticGenerateHandler,
  routeLoader$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import styles from "./markdown.module.css";
import { Tags } from "~/components/tags";
import { NotFound } from "~/components/not-found";
import { CodeBlock } from "~/components/code-block";
import z from "zod";
import { IsolatedLink } from "~/components/link-card";
import {
  isFoldedRoot,
  FoldedContent,
  FoldedHtml,
  FoldedKeep,
  FoldedTree,
} from "~/generated";
import { Heading } from "~/components/heading";

export const usePost = routeLoader$(async ({ params, status, env }) => {
  const kv = env.get("KV");
  const post = kv && (await kv.get(params.id, { type: "json" }));
  if (isFoldedRoot(post)) {
    try {
      if (post.meta.publish) {
        return post;
      } else {
        return null;
      }
    } catch (e) {
      console.log(e);
      return null;
    }
  } else {
    status(404);
    return null;
  }
});

const MdHtml = ({ html }: { html: FoldedHtml }) => {
  const Tag = html.tag as "div";
  if (html.content.type === "html") {
    return (
      <Tag dangerouslySetInnerHTML={html.content.content} {...html.attrs} />
    );
  } else {
    return (
      <Tag key={html.id} {...html.attrs}>
        <MdChildrem inner={html.content.children} />
      </Tag>
    );
  }
};

const MdKeep = ({ keep }: { keep: FoldedKeep }) => {
  if (keep.custom.type === "codeblock") {
    return (
      <CodeBlock
        lines={keep.custom.lines}
        title={keep.custom.title || "notitle"}
      >
        <code dangerouslySetInnerHTML={keep.custom.content} />
      </CodeBlock>
    );
  } else if (keep.custom.type === "heading") {
    if (keep.content.type === "html") {
      return (
        <Heading tag={keep.custom.tag} slug={keep.custom.slug}>
          <span dangerouslySetInnerHTML={keep.content.content} />
        </Heading>
      );
    } else {
      return (
        <Heading tag={keep.custom.tag} slug={keep.custom.slug}>
          <MdChildrem inner={keep.content.children} />
        </Heading>
      );
    }
  } else if (keep.custom.type === "isolated_link") {
    return (
      <IsolatedLink
        href={keep.custom.url}
        title={keep.custom.title}
        description={keep.custom.description}
        favicon={keep.custom.favicon ? keep.custom.favicon : null}
        image={keep.custom.image ? keep.custom.image : null}
      />
    );
  }
};

const MdChildrem = ({ inner }: { inner: FoldedTree[] }) => {
  return (
    <>
      {inner.map((child) => {
        if (child.type === "html") {
          return <MdHtml key={child.id} html={child} />;
        } else if (child.type === "keep") {
          return <MdKeep key={child.id} keep={child} />;
        } else if (child.type === "text") {
          return child.text;
        }
      })}
    </>
  );
};

const Markdown = component$(({ folded }: { folded: FoldedContent }) => {
  if (folded.type === "html") {
    return (
      <article
        dangerouslySetInnerHTML={folded.content}
        class={styles.markdown}
      />
    );
  } else {
    return (
      <article class={styles.markdown}>
        <MdChildrem inner={folded.children} />
      </article>
    );
  }
});

export default component$(() => {
  const page = usePost();
  if (page.value) {
    return (
      <>
        <article data-pagefind-body>
          <header class={styles.header}>
            <h1 data-pagefind-meta={`date:${page.value.meta.date}`}>
              {page.value.meta.title}
            </h1>
            <p>{page.value.meta.description}</p>
            <div data-pagefind-meta={`tags:${page.value.meta.tags.join(",")}`}>
              <Tags tags={page.value.meta.tags} />
            </div>
          </header>
          <Markdown folded={page.value.folded} />
        </article>
      </>
    );
  } else {
    return <NotFound />;
  }
});

export const onStaticGenerate: StaticGenerateHandler = async ({ env }) => {
  const d1 = env.get("DB");
  const ids = z
    .object({ id: z.string() })
    .array()
    .nullish()
    .parse(
      d1 &&
        (await d1.prepare("SELECT id FROM posts WHERE posts.publish;").run()),
    );
  return {
    params: ids || [],
  };
};

export const head: DocumentHead = ({ params, url, resolveValue }) => {
  const post = resolveValue(usePost);
  if (post === null) {
    return {
      title: "Not found",
      meta: [
        {
          name: "description",
          content: "Not found",
        },
      ],
    };
  }
  const meta = [
    {
      name: "description",
      content: post.meta.description,
    },
    {
      property: "og:title",
      content: post.meta.title,
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
      content: post.meta.description,
    },
    {
      property: "og:locale",
      content: "ja_JP",
    },
  ];
  if (post.meta.og_image) {
    meta.push({
      property: "og:image",
      content: `${url.origin}/${post.meta.og_image}`,
    });
  }
  return {
    title: post.meta.title,
    meta,
  };
};
