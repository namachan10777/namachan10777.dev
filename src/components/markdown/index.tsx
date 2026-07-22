import type { JSX } from "react";
import { Heading } from "~/components/heading";
import * as posts from "~/generated/posts/posts";
import * as rudis from "~/generated/rudis";
import { Alert } from "./keep/alert";
import { CodeblockKeep } from "./keep/codeblock";
import { FootnoteKeep } from "./keep/footnote";
import { HeadingKeep } from "./keep/heading";
import { ImageKeep } from "./keep/image";
import { LinkCardKeep } from "./keep/linkcard";
import * as styles from "./styles.css";

interface KeepProps {
  keep: posts.BodyKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}

function Keep({ keep, inner }: KeepProps) {
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
}

function normalizeAttrs(attrs: Record<string, string | number | boolean>) {
  if (!("class" in attrs)) return attrs;
  const { class: className, ...rest } = attrs;
  return { ...rest, className };
}

export function MdNode({ node }: { node: rudis.MarkdownNode<posts.BodyKeep> }) {
  switch (node.type) {
    case "text":
      return <>{node.text}</>;
    case "eager": {
      const Tag = node.tag as keyof JSX.IntrinsicElements;
      return (
        <Tag
          {...normalizeAttrs(node.attrs)}
          dangerouslySetInnerHTML={{ __html: node.content }}
        />
      );
    }
    case "lazy": {
      const Tag = node.tag as keyof JSX.IntrinsicElements;
      return (
        <Tag {...normalizeAttrs(node.attrs)}>
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
          inner={{ type: "html", content: node.content }}
        />
      );
    case "keep_lazy":
      return (
        <Keep
          keep={node.keep}
          inner={{ type: "tree", children: node.children }}
        />
      );
  }
}

function Footnote({
  footnote,
}: {
  footnote: rudis.FootnoteDefinition<posts.BodyKeep>;
}) {
  return (
    <li className={styles.footnote}>
      <a
        className={styles.footnoteLink}
        id={`footnote-${footnote.id}`}
        href={`#footnote-reference-${footnote.id}`}
      >
        {footnote.reference}.
      </a>
      {footnote.content.type === "html" ? (
        <div
          className={styles.footnoteBody}
          dangerouslySetInnerHTML={{ __html: footnote.content.content }}
        />
      ) : (
        footnote.content.children.map((child) => (
          <MdNode node={child} key={child.hash} />
        ))
      )}
    </li>
  );
}

export function Footnotes({
  footnotes,
}: {
  footnotes: rudis.FootnoteDefinition<posts.BodyKeep>[];
}) {
  return (
    <section>
      <Heading slug="footnote" tag="h2">
        Footnote
      </Heading>
      <ol className={styles.footnotes}>
        {footnotes.map((footnote) => (
          <Footnote footnote={footnote} key={footnote.id} />
        ))}
      </ol>
    </section>
  );
}

export function Markdown({
  root,
}: {
  root: rudis.MarkdownRoot<posts.BodyKeep>;
}) {
  if (root.type === "html") {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: root.content }}
        className={styles.markdown}
      />
    );
  }
  return (
    <div className={styles.markdown}>
      {root.children.map((node) => (
        <MdNode node={node} key={node.hash} />
      ))}
    </div>
  );
}
