import * as MdAst from 'mdast';
import { unified } from "unified";
import Toml from 'toml';
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";

export type Frontmatter = {
    title: string,
    category: string[],
    name: string,
}

export type Article = {
    ast: MdAst.Root,
    frontmatter: Frontmatter,
}

type TomlInMd = {
    value: string,
}

export async function parse(src: string): Promise<Article> {
    const md = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["toml"])
    .use(remarkGfm)
    .parse(src);

    return {
        ast: md,
        frontmatter: Toml.parse((md.children[0] as TomlInMd).value) as Frontmatter,
    }
}