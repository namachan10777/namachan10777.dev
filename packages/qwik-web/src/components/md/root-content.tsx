import { Link } from "@builder.io/qwik-city";
import type * as MdAst from "mdast";
import CodeBlock from "./code-block";

export function key(node: MdAst.RootContent): string {
  return JSON.stringify(node.position);
}

const RootContent = (props: { node: MdAst.RootContent }) => {
  switch (props.node.type) {
    case "blockquote":
      return (
        <blockquote>
          {props.node.children.map((node) => (
            <RootContent key={key(node)} node={node} />
          ))}
        </blockquote>
      );
    case "paragraph":
      return (
        <p>
          {props.node.children.map((node) => (
            <RootContent key={key(node)} node={node} />
          ))}
        </p>
      );
    case "section":
      return (
        <section>
          {props.node.children.map((node) => (
            <RootContent key={key(node)} node={node} />
          ))}
        </section>
      );
    case "text":
      return props.node.value;
    case "inlineCode":
      return <code>{props.node.value}</code>;
    case "heading":
      const inner = props.node.children.map((node) => (
        <RootContent key={key(node)} node={node} />
      ));
      switch (props.node.depth) {
        case 1:
          return <h1>{inner}</h1>;
        case 2:
          return <h2>{inner}</h2>;
        case 3:
          return <h3>{inner}</h3>;
        case 4:
          return <h4>{inner}</h4>;
        case 5:
          return <h5>{inner}</h5>;
        case 6:
          return <h6>{inner}</h6>;
      }
      return null;
    case "break":
      return <br />;
    case "link":
      return (
        <Link href={props.node.url}>
          {props.node.children.map((node) => (
            <RootContent key={key(node)} node={node} />
          ))}
        </Link>
      );
    case "code":
      return (
        <CodeBlock
          text={props.node.value}
          lang={props.node.lang || undefined}
        />
      );
    case "list":
      if (props.node.ordered) {
        return (
          <ol>
            {props.node.children.map((node) => (
              <RootContent node={node} key={key(node)} />
            ))}
          </ol>
        );
      } else {
        return (
          <ul>
            {props.node.children.map((node) => (
              <RootContent node={node} key={key(node)} />
            ))}
          </ul>
        );
      }
    case "listItem":
      return (
        <li>
          {props.node.children.map((node) => (
            <RootContent node={node} key={key(node)} />
          ))}
        </li>
      );
    case "strong":
      return (
        <strong>
          {props.node.children.map((node) => (
            <RootContent node={node} key={key(node)} />
          ))}
        </strong>
      );
    default:
      return JSON.stringify(props.node);
  }
};

export default RootContent;
