import * as Unist from "unist";
import * as MdAst from "mdast";
import * as React from "react";
import Image from "next/image";

export type Props = {
  mdast: MdAst.Root;
};

function isIncludeImage(ast: Unist.Node): boolean {
  if (ast.type === "image") return true;
  switch (ast.type) {
    case "heading":
    case "paragraph": {
      const parent = ast as MdAst.Parent;
      return parent.children.some(isIncludeImage);
    }
    default:
      return false;
  }
}

function constructDom(ast: Unist.Node, key = 0) {
  switch (ast.type) {
    case "heading": {
      const heading = ast as MdAst.Heading;
      switch (heading.depth) {
        case 1:
          return (
            <h1 key={key} className="text-4xl font-medium">
              {heading.children.map(constructDom)}
            </h1>
          );
        case 2:
          return (
            <h2 key={key} className="text-3xl font-medium">
              {heading.children.map(constructDom)}
            </h2>
          );
        case 3:
          return (
            <h3 key={key} className="text-2xl font-medium">
              {heading.children.map(constructDom)}
            </h3>
          );
        case 4:
          return (
            <h4 key={key} className="text-xl font-medium">
              {heading.children.map(constructDom)}
            </h4>
          );
        case 5:
          return (
            <h5 key={key} className="text-lg font-medium">
              {heading.children.map(constructDom)}
            </h5>
          );
        case 6:
          return (
            <h6 key={key} className="text-base font-medium">
              {heading.children.map(constructDom)}
            </h6>
          );
      }
      break;
    }
    case "image": {
      const img = ast as MdAst.Image;
      const alt = img.alt ? img.alt : "";
      const altMatched = /(\d+),(\d+):/.exec(alt);
      if (altMatched) {
        const w = parseInt(altMatched[1], 10);
        const h = parseInt(altMatched[2], 10);
        return <Image key={key} src={img.url} width={w} height={h} alt={alt} />;
      } else {
        return (
          <Image key={key} src={img.url} width={100} height={100} alt={alt} />
        );
      }
    }
    case "text": {
      const text = ast as MdAst.Text;
      return text.value;
    }
    case "paragraph": {
      const paragraph = ast as MdAst.Paragraph;
      if (isIncludeImage(paragraph)) {
        return (
          <div key={key} className="my-2">
            {paragraph.children.map(constructDom)}
          </div>
        );
      } else {
        return (
          <p key={key} className="my-2">
            {paragraph.children.map(constructDom)}
          </p>
        );
      }
    }
    case "list": {
      const list = ast as MdAst.List;
      if (list.ordered) {
        return (
          <ol key={key} className="pl-2 list-decimal">
            {list.children.map(constructDom)}
          </ol>
        );
      } else {
        return (
          <ul key={key} className="pl-2 list-disc">
            {list.children.map(constructDom)}
          </ul>
        );
      }
    }
    case "listItem": {
      const listitem = ast as MdAst.ListItem;
      return <li key={key}>{listitem.children.map(constructDom)}</li>;
    }
    case "link": {
      const link = ast as MdAst.Link;
      return (
        <a
          className="underline text-gray-700 hover:text-black hover:font-medium"
          key={key}
          href={link.url}
        >
          {link.children.map(constructDom)}
        </a>
      );
    }
    case "inlineCode": {
      const inlineCode = ast as MdAst.InlineCode;
      return (
        <span key={key} className="font-mono bg-yellow-50 p-1 rounded-sm">
          {inlineCode.value}
        </span>
      );
    }
    case "toml":
      return null;
    default:
      return <span key={key}>UNSUPPORTED TYPE {ast.type}</span>;
  }
}
const Md: React.FC<Props> = (props: Props) => {
  const rootChildren = props.mdast.children;
  return <div>{rootChildren.map(constructDom)}</div>;
};

export default Md;
