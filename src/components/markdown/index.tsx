import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";
import { Heading } from "~/components/heading";
import styles from "./styles.module.css";
import { component$ } from "@builder.io/qwik";
import { Alert } from "./keep/alert";
import { CodeblockKeep } from "./keep/codeblock";
import { HeadingKeep } from "./keep/heading";
import { ImageKeep } from "./keep/image";
import { LinkCardKeep } from "./keep/linkcard";
import { FootnoteKeep } from "./keep/footnote";

interface KeepProps {
  keep: posts.BodyKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}

const Keep = component$((props: KeepProps) => {
  const { keep, inner } = props;
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
});

interface MdNodeProps {
  node: rudis.MarkdownNode<posts.BodyKeep>;
}

export const MdNode = component$((props: MdNodeProps) => {
  const { node } = props;
  switch (node.type) {
    case "text":
      return <>{node.text}</>;
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
});

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

export const Footnotes = component$(
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

export const Markdown = component$(
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
