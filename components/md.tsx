import * as Unist from "unist";
import * as MdAst from "mdast";
import * as React from "react";

export type Props = {
  mdast: MdAst.Root;
};

function calcHash(ast: Unist.Node): string {
  switch (ast.type) {
    case "heading": {
      const heading = ast as MdAst.Heading;
      return `<h${heading.depth}>${heading.children.map(calcHash)}</h>`;
    }
    case "text": {
      const text = ast as MdAst.Text;
      return text.value;
    }
    case "paragraph": {
      const paragraph = ast as MdAst.Paragraph;
      return `<p>${paragraph.children.map(calcHash)}</p>`;
    }
    default:
      throw new Error(`unsupported ast type ${ast.type}`);
  }
}

function constructDom(ast: Unist.Node) {
  switch (ast.type) {
    case "heading": {
      const heading = ast as MdAst.Heading;
      switch (heading.depth) {
        case 1:
          return (
            <h1 key={calcHash(ast)}>
              {heading.children.map((c) => constructDom(c))}
            </h1>
          );
        case 2:
          return (
            <h2 key={calcHash(ast)}>
              {heading.children.map((c) => constructDom(c))}
            </h2>
          );
        case 3:
          return (
            <h3 key={calcHash(ast)}>
              {heading.children.map((c) => constructDom(c))}
            </h3>
          );
        case 4:
          return (
            <h4 key={calcHash(ast)}>
              {heading.children.map((c) => constructDom(c))}
            </h4>
          );
        case 5:
          return (
            <h5 key={calcHash(ast)}>
              {heading.children.map((c) => constructDom(c))}
            </h5>
          );
        case 6:
          return (
            <h6 key={calcHash(ast)}>
              {heading.children.map((c) => constructDom(c))}
            </h6>
          );
      }
      break;
    }
    case "text": {
      const text = ast as MdAst.Text;
      return text.value;
    }
    case "paragraph": {
      const paragraph = ast as MdAst.Paragraph;
      return <p key={calcHash(ast)}>{paragraph.children.map(constructDom)}</p>;
    }
    case "toml":
      return null;
    default:
      return <div key={calcHash(ast)}>UNSUPPORTED TYPE {ast.type}</div>;
  }
}
const Md: React.FC<Props> = (props: Props) => {
  const rootChildren = props.mdast.children;
  return <React.Fragment>{rootChildren.map(constructDom)}</React.Fragment>;
};

export default Md;
