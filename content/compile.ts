import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import rehypePartial from "./src/rehype-partial";

const glob = new Bun.Glob("post/**/*.mdx");

for await (const path of glob.scan(".")) {
  const file = await Bun.file(path).text();
  const hast = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypePartial)
    .process(file);
  console.log(JSON.parse(String(hast)));
}
