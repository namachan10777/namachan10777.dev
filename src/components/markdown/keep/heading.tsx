import { component$ } from "@builder.io/qwik";
import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";
import { Heading, HeadingTag } from "~/components/heading";
import { MdNode } from "..";

interface HeadingKeepProps {
  keep: rudis.HeadingKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}

export const HeadingKeep = component$((props: HeadingKeepProps) => {
  const { keep, inner } = props;
  if (inner.type === "html") {
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
});
