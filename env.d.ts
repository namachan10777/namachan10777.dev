declare module "remark-sectionize" {
  import type { Node } from "mdast";
  function plugin(): <T extends Node>(ast: T) => T;
  export = plugin;
}
