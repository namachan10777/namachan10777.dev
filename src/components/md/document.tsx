import { component$ } from "@builder.io/qwik";
import type { Root, RootContent } from "mdast";

export type Props = {
  src: Root;
};

const Markdown = ({ src }: { src: RootContent }) => {
  switch (src.type) {
    case "text":
      return src.value;
    case "inlineCode":
      return <code>{src.value}</code>;
    case "footnoteReference":
      return <sup>{src.identifier}</sup>;
    case "list":
      const listInner = src.children.map((item) => (
        <li key={JSON.stringify(item.position)}>
          {item.children.map((child) => (
            <Markdown key={JSON.stringify(child.position)} src={child} />
          ))}
        </li>
      ));
      if (src.ordered) {
        return <ol>{listInner}</ol>;
      } else {
        return <ul>{listInner}</ul>;
      }
    case "footnoteDefinition":
      return (
        <div>
          <sup>{src.identifier}</sup>
          {src.children.map((child) => (
            <Markdown key={JSON.stringify(child.position)} src={child} />
          ))}
        </div>
      );
    case "strong":
      return (
        <strong>
          {src.children.map((child) => (
            <Markdown src={child} key={JSON.stringify(child.position)} />
          ))}
        </strong>
      );
    case "heading":
      const headingInner = src.children.map((child) => (
        <Markdown key={JSON.stringify(child.position)} src={child} />
      ));
      switch (src.depth) {
        case 1:
          return <h1>{headingInner}</h1>;
        case 2:
          return <h2>{headingInner}</h2>;
        case 3:
          return <h3>{headingInner}</h3>;
        case 4:
          return <h4>{headingInner}</h4>;
        case 5:
          return <h5>{headingInner}</h5>;
        case 6:
          return <h6>{headingInner}</h6>;
        default:
          return "unreachable";
      }
    case "link":
      return (
        <a href={src.url}>
          {src.children.map((child) => (
            <Markdown src={child} key={JSON.stringify(child.position)} />
          ))}
        </a>
      );
    case "code":
      return (
        <pre>
          <code>{src.value}</code>
        </pre>
      );
    case "paragraph":
      return (
        <p>
          {src.children.map((child) => (
            <Markdown key={JSON.stringify(child.position)} src={child} />
          ))}
        </p>
      );
    default:
      return <span>Unknown type: {src.type}</span>;
  }
};

export default component$(({ src }: Props) => {
  return (
    <>
      {src.children.map((child) => (
        <Markdown key={JSON.stringify(child.position)} src={child} />
      ))}
    </>
  );
});
