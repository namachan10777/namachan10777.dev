import { defineConfig, defineCollection } from "@content-collections/core";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkRetext from "remark-retext";
import retextEnglish from "retext-english";
import retextEquality from "retext-english";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import type { Root, RootContent } from "mdast";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";
import crypto from "crypto";
import { codeToHast } from "shiki";
import type * as hast from "hast";
import remarkSectionize from "remark-sectionize";

export type TransformedImage = {
  path: string;
  dim: {
    w: number;
    h: number;
  };
};

export type WithTransformedImage = {
  transformed?: TransformedImage[];
};

export type ImageTransformationConfig = {
  readonly outputRoot: string;
  readonly outputSubDir: string;
  readonly sourceBaseDir: string;
  readonly scaling: number;
};

type TransformContext = {
  readonly filePath: string;
};

function isAbslutePath(imgUrl: string): boolean {
  return /^https?:\/\//.test(imgUrl) || imgUrl.startsWith("/");
}

function srcImgPath(
  config: ImageTransformationConfig,
  ctx: TransformContext,
  imgUrl: string,
): string {
  if (isAbslutePath(imgUrl)) {
    return imgUrl;
  }
  const contentDir = /^(.+)\/?$/.exec(config.sourceBaseDir)?.[0];
  if (contentDir == undefined) {
    return imgUrl;
  }

  const srcPath = path.parse(ctx.filePath);

  if (srcPath.dir === "") {
    return `${contentDir}/${imgUrl}`;
  } else {
    return `${contentDir}/${srcPath.dir}/${imgUrl}`;
  }
}

// Assume the output format is WebP
function generateImgDistFileName(
  imgUrl: string,
  dim?: {
    width: number;
    height: number;
  },
) {
  if (isAbslutePath(imgUrl)) {
    return imgUrl;
  }
  const baseNameHash = crypto
    .createHash("sha256")
    .update(imgUrl)
    .digest("base64")
    .slice(0, 8);
  const baseName = path.parse(imgUrl).name;
  if (dim) {
    return `${baseName}-${baseNameHash}-${Math.round(dim.width)}x${Math.round(dim.height)}.webp`;
  } else {
    return `${baseName}-${baseNameHash}.webp`;
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

async function traverseMdAst<T extends RootContent>(
  config: ImageTransformationConfig,
  ctx: TransformContext,
  ast: T,
) {
  switch (ast.type) {
    case "code":
      if (ast.lang) {
        const styled = await codeToHast(ast.value, {
          lang: ast.lang,
          theme: "github-light",
        });
        (ast as unknown as { hast: hast.Root }).hast = styled;
      }
      return;
    case "break":
    case "definition":
    case "html":
    case "footnoteReference":
    case "imageReference":
    case "inlineCode":
    case "text":
    case "thematicBreak":
    case "yaml":
    case "mdxTextExpression":
    case "mdxFlowExpression":
    case "mdxjsEsm":
      return;
    case "image":
      if (
        ast.url.startsWith("https://") ||
        ast.url.startsWith("http://") ||
        ast.url.startsWith("/")
      ) {
        return;
      }

      const buffer = await fs.readFile(srcImgPath(config, ctx, ast.url));
      const image = sharp(buffer);
      let { width, height } = await image.metadata();
      if (!(width && height)) return;

      const images: TransformedImage[] = [];

      while (width > 300) {
        const fileName = generateImgDistFileName(ast.url, { width, height });
        const distPath = `${config.outputSubDir}/${fileName}`;
        const distPathOnFs = `${config.outputRoot}/${distPath}`;

        if (!(await exists(distPathOnFs))) {
          const resized = await image
            .resize(Math.round(width), Math.round(height))
            .toBuffer();
          await fs.writeFile(distPathOnFs, resized);
          console.log(`INFO: transformed markdown image: ${fileName}`);
        }

        images.push({
          path: `/${distPath}`,
          dim: {
            w: Math.round(width),
            h: Math.round(height),
          },
        });
        width *= config.scaling;
        height *= config.scaling;
      }
      (ast as unknown as WithTransformedImage).transformed = images;
      return;
    default:
      await Promise.all(
        ast.children.map((child) => traverseMdAst(config, ctx, child)),
      );
  }
}

async function generateImages(
  config: ImageTransformationConfig,
  ctx: TransformContext,
  ast: Root,
) {
  await fs.mkdir(`${config.outputRoot}/${config.outputSubDir}`, {
    recursive: true,
  });
  await Promise.all(
    ast.children.map((child) => traverseMdAst(config, ctx, child)),
  );
}

const blog = defineCollection({
  name: "blog",
  directory: "src/content/blog",
  include: "**/*.mdx",
  schema: (z) => ({
    title: z.string(),
    date: z.string(),
    category: z.array(z.string()),
    publish: z.boolean(),
    description: z.string(),
  }),
  transform: async (document) => {
    const mdast = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMdx)
      .parse(document.content);
    const sectionizer = remarkSectionize();
    sectionizer(mdast);
    const config = {
      outputRoot: "public",
      outputSubDir: "img",
      scaling: 0.7,
      sourceBaseDir: "src/content/blog",
    };
    const ctx = {
      filePath: document._meta.filePath,
    };
    await generateImages(config, ctx, mdast);
    const text = await unified()
      .use(remarkParse)
      .use(
        remarkRetext,
        unified().use(retextEnglish).use(retextEquality) as any,
      )
      .use(remarkStringify)
      .process(document.content);
    return {
      ...document,
      mdast: mdast as any,
      text: String(text),
    };
  },
});

const paper = defineCollection({
  name: "paper",
  directory: "src/content/paper",
  include: "**/*.yml",
  schema: (z) => ({
    title: z.string(),
    year: z.number(),
    booktitle: z.string(),
    href: z.string().nullish(),
  }),
});

export default defineConfig({
  collections: [blog, paper],
});
