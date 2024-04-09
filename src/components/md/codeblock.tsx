import { component$, useStyles$ } from "@builder.io/qwik";
import type * as hast from "hast";
import { hastToHtml } from "shiki";
import styles from "./codeblock.css?inline";

export type Props = {
  hast?: hast.Root;
  src: string;
};

export default component$((props: Props) => {
  useStyles$(styles);
  if (props.hast) {
    const html = hastToHtml(props.hast.children as any);
    return (
      <div
        class="my-2 overflow-x-scroll border-b border-t py-2 text-sm"
        dangerouslySetInnerHTML={html}
      ></div>
    );
  } else {
    return (
      <div class="overflow-x-scroll py-2 text-sm">
        <pre>
          <code>{props.src}</code>
        </pre>
      </div>
    );
  }
});
