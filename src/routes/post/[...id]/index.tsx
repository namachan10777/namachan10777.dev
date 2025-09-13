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
import { Heading, HeadingTag } from "~/components/heading";
import * as v from "valibot";
import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";

export const usePost = routeLoader$(async ({ params, status, env }) => {
  try {
    const kv = env.get("KV");
    const value = kv && (await kv.get(params.id, { type: "json" }));
    return value as posts.BodyContent;
  } catch (error) {
    console.warn(JSON.stringify(error, null, "  "));
    status(404);
    return null;
  }
});

type Children =
  | {
      type: "eager";
      content: string;
    }
  | {
      type: "lazy";
      children: rudis.MarkdownNode<posts.BodyKeep>[];
    };

const Alert = ({ alert, inner }: { alert: rudis.Alert; inner: Children }) => {
  if (inner.type === "eager") {
    return <div>{alert.kind}</div>;
  } else if (inner.type === "lazy") {
    return <div>{alert.kind}</div>;
  }
};

const CodeblockKeep = ({
  keep,
  inner,
}: {
  keep: rudis.Codeblock;
  inner: Children;
}) => {
  if (inner.type === "eager") {
    return (
      <CodeBlock lines={keep.lines} title={keep.title || "notitle"}>
        <code dangerouslySetInnerHTML={inner.content} />
      </CodeBlock>
    );
  } else {
    return (
      <CodeBlock lines={keep.lines} title={keep.title || "notitle"}>
        <code>
          {inner.children.map((child) => (
            <MdNode key={child.hash} node={child} />
          ))}
        </code>
      </CodeBlock>
    );
  }
};

const HeadingKeep = ({
  keep,
  inner,
}: {
  keep: rudis.Heading;
  inner: Children;
}) => {
  if (inner.type === "eager") {
    return (
      <Heading tag={`h${keep.level}` as HeadingTag} slug={keep.slug}>
        <span dangerouslySetInnerHTML={inner.content} />
      </Heading>
    );
  } else {
    return (
      <Heading tag={`h${keep.level}` as HeadingTag} slug={keep.slug}>
        {inner.children.map((child) => (
          <MdNode key={child.hash} node={child} />
        ))}
      </Heading>
    );
  }
};

const ImageKeep = ({ keep }: { keep: rudis.Image<rudis.R2ImageStorage> }) => {
  const srcset = [
    `/${keep.storage.key}?format=webp&width=300 400w`,
    `/${keep.storage.key}?format=webp&width=500 600`,
    `/${keep.storage.key}?format=webp&width=800 1200w`,
    `/${keep.storage.key}?format=webp&width=1000 2000`,
  ].join(",");
  return (
    <img
      src={`/${keep.storage.key}width=100&format=webp`}
      srcset={srcset}
      alt={keep.alt}
      width={keep.width}
      height={keep.height}
      loading="lazy"
      decoding="async"
    />
  );
};

const LinkCardKeep = ({ keep }: { keep: rudis.LinkCard }) => {
  return (
    <IsolatedLink
      href={keep.href}
      title={keep.title}
      description={keep.description}
      favicon={keep.favicon ? keep.favicon : null}
      image={keep.og_image ? keep.og_image : null}
    />
  );
};

const FootnoteKeep = ({ keep }: { keep: rudis.FootnoteReference }) => {
  return (
    <sup>
      <a id={`footnote-reference-${keep.id}`} href={`#footnote-${keep.id}`}>
        [{keep.reference ? keep.reference : "?"}]
      </a>
    </sup>
  );
};

const Keep = ({ keep, inner }: { keep: posts.BodyKeep; inner: Children }) => {
  switch (keep.type) {
    case "alert":
      return <Alert alert={keep} inner={inner} />;
    case "codeblock":
      return <CodeblockKeep keep={keep} inner={inner} />;
    case "heading":
      return <HeadingKeep keep={keep} inner={inner} />;
    case "image":
      return <ImageKeep keep={keep} />;
    case "link_card":
      return <LinkCardKeep keep={keep} />;
    case "footnote_reference":
      return <FootnoteKeep keep={keep} />;
  }
  return <div></div>;
};

const MdNode = ({ node }: { node: rudis.MarkdownNode<posts.BodyKeep> }) => {
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

const Footnote = component$(
  ({ footnote }: { footnote: rudis.FootnoteDefinition<posts.BodyKeep> }) => {
    return (
      <li class={styles.footnote}>
        <a
          class={styles.footnoteLink}
          id={`footnote-${footnote.id}`}
          href={`#footnote-reference-${footnote.id}`}
        >
          {footnote.reference}.
        </a>
        {footnote.content.type === "html" ? (
          <div
            class={styles.footnoteBody}
            dangerouslySetInnerHTML={footnote.content.content}
          />
        ) : (
          footnote.content.children.map((child) => (
            <MdNode node={child} key={child.hash} />
          ))
        )}
      </li>
    );
  },
);

const Footnotes = component$(
  ({
    footnotes,
  }: {
    footnotes: rudis.FootnoteDefinition<posts.BodyKeep>[];
  }) => {
    return (
      <section>
        <Heading slug="footnote" tag="h2">
          Footnote
        </Heading>
        <ol class={styles.footnotes}>
          {footnotes.map((footnote) => (
            <Footnote footnote={footnote} key={footnote.id} />
          ))}
        </ol>
      </section>
    );
  },
);

const Markdown = component$(
  ({ root }: { root: rudis.MarkdownRoot<posts.BodyKeep> }) => {
    if (root.type === "html") {
      return (
        <>
          <div dangerouslySetInnerHTML={root.content} class={styles.markdown} />
        </>
      );
    } else {
      return (
        <>
          <div class={styles.markdown}>
            {root.children.map((node) => (
              <MdNode node={node} key={node.hash} />
            ))}
          </div>
        </>
      );
    }
  },
);

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
          {page.value.footnotes.length > 0 && (
            <Footnotes footnotes={page.value.footnotes} />
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
  const schema = v.nullish(
    v.array(
      v.object({
        id: v.string(),
      }),
    ),
  );
  const ids = v.parse(
    schema,
    d1 && (await d1.prepare("SELECT id FROM posts WHERE posts.publish;").run()),
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
