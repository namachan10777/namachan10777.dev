import { Root, Parent } from "mdast";

declare module "remark-sectionize" {
  function remarkSectionize(): (root: Root) => void;
  export default remarkSectionize;
}

export interface Section extends Parent {
  type: "section";
}

declare module "mdast" {
  interface RootContentMap {
    section: Section;
  }
}
