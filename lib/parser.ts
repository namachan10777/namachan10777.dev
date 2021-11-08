import Yaml from "js-yaml";
import * as MdAst from "mdast";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type Frontmatter = {
  title: string;
  category: string[];
  name: string;
};

export type DiaryFrontmatter = {
  date: Date;
};

export type Article = {
  ast: MdAst.Root;
  frontmatter: Frontmatter;
};

export type Diary = {
  ast: MdAst.Root;
  frontmatter: DiaryFrontmatter;
};

type YamlInMd = {
  value: string;
};

export async function parse(src: string): Promise<Article> {
  const md = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .parse(src);

  return {
    ast: md,
    frontmatter: Yaml.load((md.children[0] as YamlInMd).value) as Frontmatter,
  };
}

export async function parseDiary(src: string): Promise<Diary> {
  const md = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .parse(src);

  return {
    ast: md,
    frontmatter: Yaml.load(
      (md.children[0] as YamlInMd).value
    ) as DiaryFrontmatter,
  };
}
