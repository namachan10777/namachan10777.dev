import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";

export const Alert = ({
  alert,
  inner,
}: {
  alert: rudis.AlertKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}) => {
  if (inner.type === "html") {
    return <div>{alert.kind}</div>;
  } else if (inner.type === "tree") {
    return <div>{alert.kind}</div>;
  }
};
