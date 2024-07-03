import type { Node, Root, Image } from "mdast";
import { visit } from "unist-util-visit";
import path from "node:path";
import sharp from "sharp";

declare module "mdast" {
  interface ImageData {
    geometry: {
      width: number;
      height: number;
    };
  }
}

export interface Options {
  documentPath: string;
}

function isObject(value: unknown): value is Object {
  return typeof value === "object";
}

function isNode(value: unknown): value is Node {
  return isObject(value) && "type" in value;
}

function isImageNode<T>(node: unknown): node is Image {
  return isNode(node) && node.type === "image";
}

function remarkImageExtract(options: Options): (root: Root) => Promise<void> {
  return async (root: Root) => {
    const images: Image[] = [];
    visit(root, isImageNode, (node: Image) => {
      images.push(node);
    });
    const dir = path.dirname(options.documentPath);
    await Promise.all(
      images.map(async (node) => {
        const isRemote = node.url.startsWith("http");
        const buffer = isRemote
          ? await (await fetch(node.url)).arrayBuffer()
          : await Bun.file(path.join(dir, node.url)).arrayBuffer();
        const image = sharp(buffer);
        const metadata = await image.metadata();
        node.data = {
          geometry: {
            width: metadata.width || 100,
            height: metadata.height || 100,
          },
        };
      })
    );
  };
}

export default remarkImageExtract;
