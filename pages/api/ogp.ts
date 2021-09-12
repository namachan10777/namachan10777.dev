import * as Canvas from "node-canvas";
import * as path from 'path';
import { NextApiRequest, NextApiResponse } from "next";

function getRows(
  ctx: Canvas.CanvasRenderingContext2D,
  text: string,
  W: number
) {
  const words = text.split(" ");

  const rows = [words[0]];

  for (let i = 1; i < words.length; ++i) {
    const measure = ctx.measureText(`${rows[rows.length - 1]} ${words[i]}`);
    if (measure.width > W) {
      rows.push(words[i]);
    } else {
      rows[rows.length - 1] = `${rows[rows.length - 1]} ${words[i]}`;
    }
  }

  return rows;
}

function renderTexts(
  ctx: Canvas.CanvasRenderingContext2D,
  rows: string[],
  lineHeight: number,
  W: number,
  H: number
) {
  ctx.fillStyle = "black";
  ctx.font = `${lineHeight}px "Noto"`;
  for (let i = 0; i < rows.length; ++i) {
    const textWidth = ctx.measureText(rows[i]).width;
    const x = (W - textWidth) / 2;
    const y = (H - rows.length * lineHeight) / 2 + lineHeight * i;
    ctx.fillText(rows[i], x, y);
  }
  ctx.font = `${Math.ceil((lineHeight / 3) * 2)}px "Noto"`;
  const siteNameWidth = ctx.measureText("namachan10777.dev").width;
  ctx.fillText(
    "namachan10777.dev",
    (W - siteNameWidth) / 2,
    H - (lineHeight / 3) * 2 - 40
  );
}

function createOGP(title: string): Buffer {
  const W = 1200;
  const H = 630;
  const canvas = Canvas.createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  Canvas.registerFont(path.resolve('./fonts/NotoSansCJKjp-Regular.otf'), {family: "Noto"});
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, W, H);
  renderTexts(ctx, getRows(ctx, title, W), 40, W, H);
  return canvas.toBuffer();
}

export default async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const titleRaw = req.query.title ? req.query.title : "namachan10777.dev";
  const title = Array.isArray(titleRaw) ? titleRaw.join(" ") : titleRaw;
  const buf = await createOGP(title);
  res.writeHead(200, {
    "Content-Type": "image/png",
    "Content-Length": buf.length,
  });
  res.end(buf, "binary");
};
