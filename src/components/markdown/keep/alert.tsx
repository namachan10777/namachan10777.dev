import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";

interface AlertProps {
  alert: rudis.AlertKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}

export function Alert(props: AlertProps) {
  const { alert } = props;
  return <div>{alert.kind}</div>;
}
