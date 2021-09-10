import * as Unist from 'unist';
import * as MdAst from 'mdast';
import * as React from 'react';

export type Props = {
  mdast: MdAst.Root,
};

function construct_dom(ast: Unist.Node) {
  switch (ast.type) {
  case 'heading': {
    const heading = ast as MdAst.Heading;
    switch (heading.depth) {
    case 1: return <h1>{heading.children.map((c) => construct_dom(c))}</h1>
    case 2: return <h1>{heading.children.map((c) => construct_dom(c))}</h1>
    case 3: return <h1>{heading.children.map((c) => construct_dom(c))}</h1>
    case 4: return <h1>{heading.children.map((c) => construct_dom(c))}</h1>
    case 5: return <h1>{heading.children.map((c) => construct_dom(c))}</h1>
    case 6: return <h1>{heading.children.map((c) => construct_dom(c))}</h1>
    }
  }
  case 'text': {
    const text = ast as MdAst.Text;
    return text.value;
  }
  case 'paragraph': {
    const paragraph = ast as MdAst.Paragraph;
    return <p>{paragraph.children.map(construct_dom)}</p>
  }
  default:
    return <div>UNSUPPORTED TYPE {ast.type}</div>
  }
}
const Md: React.FC<Props> = (props: Props) => {
  const root_children = props.mdast.children;
  return (<React.Fragment>{root_children.map(construct_dom)}</React.Fragment>);
}

export default Md;
