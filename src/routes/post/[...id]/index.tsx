import { Slot, component$ } from "@builder.io/qwik";
import {
  StaticGenerateHandler,
  routeLoader$,
  type DocumentHead,
} from "@builder.io/qwik-city";
import styles from "./markdown.module.css";
import { Tags } from "~/components/tags";
import { NotFound } from "~/components/not-found";
import {
  FoldedContent,
  FoldedHtml,
  FoldedKeep,
  FoldedTree,
  HeadingTag,
  foldedRootSchema,
} from "~/lib/schema";
import z from "zod";

export const usePost = routeLoader$(async ({ params, status, env }) => {
  const kv = env.get("KV");
  const post = kv && (await kv.get(params.id));
  console.log(post);
  if (post) {
    return foldedRootSchema.parse(JSON.parse(post));
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

const Codeblock = component$(
  ({
    lines,
    title,
    content,
  }: {
    lines: number;
    title: string | undefined | null;
    content: string;
  }) => {
    return (
      <div>
        <span>
          {Array.from({ length: lines }, (_, i) => (
            <span key={i}>{i}</span>
          ))}
        </span>
        {title && <span>{title}</span>}
        <pre>
          <code dangerouslySetInnerHTML={content} />
        </pre>
      </div>
    );
  },
);

const Heading = component$(
  ({ tag, slug }: { tag: HeadingTag; slug: string }) => {
    const Tag = tag;
    return (
      <Tag id={slug}>
        <Slot />
      </Tag>
    );
  },
);

const IsolatedLink = component$(
  ({
    href,
    title,
    description,
    image_url,
  }: {
    href: string;
    title: string;
    description: string;
    image_url?: string;
  }) => {
    return (
      <a href={href}>
        {image_url && <img src={image_url} alt={title} />}
        <div>
          <span>{title}</span>
          <span>{description}</span>
        </div>
      </a>
    );
  },
);

const MdKeep = ({ keep }: { keep: FoldedKeep }) => {
  if (keep.custom.type === "codeblock") {
    return (
      <Codeblock
        lines={keep.custom.lines}
        title={keep.custom.title}
        content={keep.custom.content}
      />
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
        image_url={keep.custom.image_url}
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
        class={styles.markdonw}
      />
    );
  } else {
    return (
      <article class={styles.markdonw}>
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
    .parse(d1 && (await d1.prepare("SELECT id FROM posts;").run()));
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
