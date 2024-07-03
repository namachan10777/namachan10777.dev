import { Resource, component$, useResource$ } from "@builder.io/qwik";
import {
  type BundledLanguage,
  codeToHtml,
  type StringLiteralUnion,
  type SpecialLanguage,
} from "shiki";

export interface Props {
  lang?: StringLiteralUnion<BundledLanguage | SpecialLanguage>;
  text: string;
}

export default component$((props: Props) => {
  const codeResource = useResource$<string>(async () => {
    if (props.lang) {
      return codeToHtml(props.text, {
        lang: props.lang,
        themes: {
          dark: "github-dark-dimmed",
          light: "github-light",
        },
      });
    } else {
      return `<code>${props.text}</code>`;
    }
  });
  return (
    <figure>
      <Resource
        value={codeResource}
        onPending={() => <pre></pre>}
        onResolved={(text) => <div dangerouslySetInnerHTML={text} />}
        onRejected={(err) => <div>{JSON.stringify(err)}</div>}
      ></Resource>
    </figure>
  );
});
