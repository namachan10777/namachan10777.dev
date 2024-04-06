import { defineConfig, defineCollection } from "@content-collections/core";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import { unified } from "unified";
import { Image, Root, RootContent } from "mdast";
import * as fs from "fs/promises";
import * as path from "path";
import sharp from "sharp";
import crypto from "crypto";

export type TransformedImage = {
  path: string;
  dim: {
    w: number;
    h: number;
  },
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
  return /^https?:\/\//.test(imgUrl) || imgUrl.startsWith('/');
}

function srcImgPath(config: ImageTransformationConfig, ctx: TransformContext, imgUrl: string): string {
  if (isAbslutePath(imgUrl)) {
    return imgUrl;
  }
  const contentDir = /^(.+)\/?$/.exec(config.sourceBaseDir)?.[0];
  if (contentDir == undefined) {
    return imgUrl;
  }

  const srcPath = path.parse(ctx.filePath);

  if (srcPath.dir === '') {
    return `${contentDir}/${imgUrl}`;
  }
  else {
    return `${contentDir}/${srcPath.dir}/${imgUrl}`;
  }
}

// Assume the output format is WebP
function generateImgDistFileName(config: ImageTransformationConfig, imgUrl: string, width: number, height: number) {
  if (isAbslutePath(imgUrl)) {
    return imgUrl;
  }
  const baseNameHash = crypto.createHash('sha256').update(imgUrl).digest('base64').slice(0, 8);
  const baseName = path.parse(imgUrl).base;
  return `${baseName}-${baseNameHash}-${Math.round(width)}x${Math.round(height)}.webp`;
}

async function traverseMdAst<T extends RootContent>(config: ImageTransformationConfig, ctx: TransformContext, ast: T) {
  switch (ast.type) {
    case "break":
    case "code":
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
      if (ast.url.startsWith("https://") || ast.url.startsWith("http://") || ast.url.startsWith("/")) {
        return;
      }

      const buffer = await fs.readFile(srcImgPath(config, ctx, ast.url));
      const image = sharp(buffer);
      let { width, height } = await image.metadata();
      if (!(width && height)) return;

      const images: TransformedImage[] = [];

      while (width > 300) {
        const resized = await image.resize(Math.round(width), Math.round(height)).toBuffer();
        const fileName = generateImgDistFileName(config, ast.url, width, height);
        console.log(`INFO: transformed markdown image: ${fileName}`);
        const distPath = `${config.outputSubDir}/${fileName}`;
        await fs.writeFile(`${config.outputRoot}/${distPath}`, resized);
        images.push({
          path: distPath,
          dim: {
            w: width,
            h: height,
          }
        });
        width *= config.scaling;
        height *= config.scaling;
      }
      if (ast.data) {
        (ast.data as unknown as WithTransformedImage).transformed = images;
      }
      else {
        (ast as unknown as { data: WithTransformedImage }).data = {
          transformed: images,
        };
      }
      return;
    default:
      await Promise.all(ast.children.map((child) => traverseMdAst(config, ctx, child)))
  }
}

async function generateImages(config: ImageTransformationConfig, ctx: TransformContext, ast: Root) {
  await fs.mkdir(`${config.outputRoot}/${config.outputSubDir}`, { recursive: true });
  await Promise.all(ast.children.map((child) => traverseMdAst(config, ctx, child)))
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
    const mdast = unified().use(remarkParse).use(remarkGfm).use(remarkMdx).parse(document.content);
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
    return {
      ...document,
      mdast: mdast as any,
    };
  },
});

export default defineConfig({
  collections: [blog],
});
