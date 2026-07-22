import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";
import { Heading } from "~/components/heading";
import { MdNode } from "..";

interface HeadingKeepProps {
  keep: rudis.HeadingKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}

export function HeadingKeep(props: HeadingKeepProps) {
  const { keep, inner } = props;
  if (inner.type === "html") {
    return (
      <Heading tag={`h${keep.level}`} slug={keep.slug}>
        <span dangerouslySetInnerHTML={{ __html: inner.content }} />
      </Heading>
    );
  } else {
    return (
      <Heading tag={`h${keep.level}`} slug={keep.slug}>
        {inner.children.map((child) => (
          <MdNode key={child.hash} node={child} />
        ))}
      </Heading>
    );
  }
}
