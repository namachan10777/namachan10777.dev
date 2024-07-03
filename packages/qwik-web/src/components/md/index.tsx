import { component$ } from "@builder.io/qwik";
import type * as MdAst from "mdast";
import RootContent from "~/components/md/root-content";

export interface Props {
  root: MdAst.Root;
}

function key(base: unknown): string {
  return JSON.stringify(base);
}

export default component$((props: Props) => {
  return (
    <article>
      {props.root.children.map((node) => (
        <RootContent key={key(node.position)} node={node} />
      ))}
    </article>
  );
});
