import { chakra, useColorModeValue } from "@chakra-ui/react";
import * as MdAst from "mdast";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import Refractor from "react-refractor";
import * as Unist from "unist";
import js from 'refractor/lang/javascript';
import sh from 'refractor/lang/bash';

export type Props = {
  mdast: MdAst.Root;
};

Refractor.registerLanguage(js);
Refractor.registerLanguage(sh);

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
            <chakra.h1
              key={key}
              fontSize="4xl"
              mb={2}
              mt={4}
              fontWeight="semibold"
              fontFamily="mono"
            >
              # {heading.children.map(constructDom)}
            </chakra.h1>
          );
        case 2:
          return (
            <chakra.h2
              key={key}
              fontSize="3xl"
              mb={2}
              mt={6}
              fontWeight="semibold"
              fontFamily="mono"
            >
              # {heading.children.map(constructDom)}
            </chakra.h2>
          );
        case 3:
          return (
            <chakra.h3
              key={key}
              fontSize="2xl"
              mb={2}
              mt={5}
              fontWeight="semibold"
              fontFamily="mono"
            >
              # {heading.children.map(constructDom)}
            </chakra.h3>
          );
        case 4:
          return (
            <chakra.h4
              key={key}
              fontSize="xl"
              mb={2}
              mt={4}
              fontWeight="semibold"
              fontFamily="mono"
            >
              # {heading.children.map(constructDom)}
            </chakra.h4>
          );
        case 5:
          return (
            <chakra.h5
              key={key}
              fontSize="lg"
              mb={2}
              mt={4}
              fontWeight="semibold"
              fontFamily="mono"
            >
              # {heading.children.map(constructDom)}
            </chakra.h5>
          );
        case 6:
          return (
            <chakra.h6
              key={key}
              fontSize="base"
              mb={2}
              mt={4}
              fontWeight="semibold"
              fontFamily="mono"
            >
              # {heading.children.map(constructDom)}
            </chakra.h6>
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
          <chakra.div key={key} my={2}>
            {paragraph.children.map(constructDom)}
          </chakra.div>
        );
      } else {
        return (
          <chakra.p key={key} my={2} lineHeight={7}>
            {paragraph.children.map(constructDom)}
          </chakra.p>
        );
      }
    }
    case "list": {
      const list = ast as MdAst.List;
      if (list.ordered) {
        return (
          <chakra.ol key={key} pl={2} listStyleType="decimal">
            {list.children.map(constructDom)}
          </chakra.ol>
        );
      } else {
        return (
          <chakra.ul key={key} pl={2} listStyleType="disc">
            {list.children.map(constructDom)}
          </chakra.ul>
        );
      }
    }
    case "listItem": {
      const listitem = ast as MdAst.ListItem;
      return <li key={key}>{listitem.children.map(constructDom)}</li>;
    }
    case "link": {
      const colorUnselected = useColorModeValue("gray.700", "gray.300");
      const colorSelected = useColorModeValue("black", "white");
      const link = ast as MdAst.Link;
      if (link.url.startsWith("/")) {
        return (
          <Link key={key} href={link.url} passHref={true}>
            <chakra.a
              textDecor="underline"
              color={colorUnselected}
              _hover={{
                color: colorSelected,
                fontsize: "medium",
              }}
            >
              {link.children.map(constructDom)}
            </chakra.a>
          </Link>
        );
      } else {
        return (
          <chakra.a
            textDecor="underline"
            color={colorUnselected}
            _hover={{
              color: colorSelected,
              fontsize: "medium",
            }}
            key={key}
            href={link.url}
          >
            {link.children.map(constructDom)}
          </chakra.a>
        );
      }
    }
    case "inlineCode": {
      const inlineCode = ast as MdAst.InlineCode;
      const bgColor = useColorModeValue("yellow.50", "yellow.800");
      return (
        <chakra.span
          key={key}
          fontFamily="mono"
          bgColor={bgColor}
          p={1}
          rounded="sm"
        >
          {inlineCode.value}
        </chakra.span>
      );
    }
    case "code": {
      const code = ast as MdAst.Code;
      const lang = code.lang ? code.lang : "text";
      return <Refractor key={key} language={lang} value={code.value} />;
    }
    case "yaml":
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
