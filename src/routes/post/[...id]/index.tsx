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
import { IsolatedLink } from "~/components/link-card";
import { Heading } from "~/components/heading";
import * as v from "valibot";
import * as schema from "~/schema";

export const usePost = routeLoader$(async ({ params, status, env }) => {
  const kv = env.get("KV");
  const post = v.safeParse(
    schema.post,
    kv && (await kv.get(params.id, { type: "json" })),
  );
  if (post.success) {
    return post.output;
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

type Children =
  | {
      type: "eager";
      content: string;
    }
  | {
      type: "lazy";
      children: schema.Tree[];
    };

const Alert = ({ alert, inner }: { alert: schema.Alert; inner: Children }) => {
  if (inner.type === "eager") {
    return <div>{alert.kind}</div>;
  } else if (inner.type === "lazy") {
    return <div>{alert.kind}</div>;
  }
};

const Keep = ({ keep, inner }: { keep: schema.Keep; inner: Children }) => {
  switch (keep.type) {
    case "alert":
      return <Alert alert={keep} inner={inner} />;
  }
  return <div></div>;
};

const MdNode = ({ node }: { node: schema.Tree }) => {
  switch (node.type) {
    case "text":
      return node.text;
    case "eager": {
      const Tag = node.tag as "div";
      return <Tag {...node.attrs} dangerouslySetInnerHTML={node.content} />;
    }
    case "lazy": {
      const Tag = node.tag as "div";
      return (
        <Tag {...node.attrs}>
          {node.children.map((child) => (
            <MdNode key={child.hash} node={child} />
          ))}
        </Tag>
      );
    }
    case "keep_eager":
      return (
        <Keep
          keep={node.keep}
          inner={{ type: "eager", content: node.content }}
        />
      );
    case "keep_lazy":
      return (
        <Keep
          keep={node.keep}
          inner={{ type: "lazy", children: node.children }}
        />
      );
  }
};

const Markdown = component$(({ root }: { root: schema.Root }) => {
  if (root.type === "html") {
    return (
      <article dangerouslySetInnerHTML={root.content} class={styles.markdown} />
    );
  } else {
    return (
      <article class={styles.markdown}>
        {root.children.map((node) => (
          <MdNode key={node.hash} />
        ))}
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
            <h1 data-pagefind-meta={`date:${page.value.frontmatter.date}`}>
              {page.value.frontmatter.title}
            </h1>
            <p>{page.value.frontmatter.description}</p>
            <div
              data-pagefind-meta={`tags:${page.value.frontmatter.tags.join(",")}`}
            >
              <Tags
                tags={page.value.frontmatter.tags.map((record) => record.tag)}
              />
            </div>
          </header>
          {page.value.root.type === "html" ? (
            <div dangerouslySetInnerHTML={page.value.root.content} />
          ) : (
            <Markdown root={page.value.root} />
          )}
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
      content: post.frontmatter.description,
    },
    {
      property: "og:title",
      content: post.frontmatter.title,
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
      content: post.frontmatter.description,
    },
    {
      property: "og:locale",
      content: "ja_JP",
    },
  ];
  if (post.frontmatter.og_image) {
    const og = post.frontmatter.og_image;
    meta.push({
      property: "og:image",
      content: `${url.origin}/image?bucket=${og.pointer.bucket}?key=${og.pointer.key}?format=webp`,
    });
  }
  return {
    title: post.frontmatter.title,
    meta,
  };
};
