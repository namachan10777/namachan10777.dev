import type { Node } from "mdast";

declare module "remark-sectionize" {
  function plugin(): <T extends Node>(ast: T) => T;
}
