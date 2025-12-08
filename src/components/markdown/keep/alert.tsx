import { component$ } from "@builder.io/qwik";
import * as rudis from "~/generated/rudis";
import * as posts from "~/generated/posts/posts";

interface AlertProps {
  alert: rudis.AlertKeep;
  inner: rudis.MarkdownRoot<posts.BodyKeep>;
}

export const Alert = component$((props: AlertProps) => {
  const { alert } = props;
  return <div>{alert.kind}</div>;
});
