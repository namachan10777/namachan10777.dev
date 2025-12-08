import { component$ } from "@builder.io/qwik";
import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";
import { CodeBlock } from "~/components/code-block";
import { MdNode } from "..";

interface CodeblockKeepProps {
  keep: rudis.CodeblockKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}

export const CodeblockKeep = component$((props: CodeblockKeepProps) => {
  const { keep, inner } = props;
  if (inner.type === "html") {
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
});
