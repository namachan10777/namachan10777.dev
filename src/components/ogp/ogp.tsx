import { Buffer } from "node:buffer";
import fetch from "node-fetch-cache";
import satori from "satori";
import sharp from "sharp";

export type OgImageProps = {
  title: string;
  url: string;
  description?: string | undefined;
  titleFontSize?: number;
  width: number;
  height: number;
};

export async function ogImage(props: OgImageProps) {
  const { title, titleFontSize, description, url, width, height } = props;
  const svg = await satori(
    <article
      style={{
        display: "flex",
        backgroundColor: "white",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        width: "100%",
      }}
    >
      <section
        style={{
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: "Roboto Mono",
            fontSize: `${titleFontSize || 6}rem`,
            fontWeight: 600,
          }}
        >
          {title}
        </h1>
        <span style={{ fontSize: "2rem", color: "rgba(0,0,0,70%)" }}>
          {description}
        </span>
      </section>
      <section
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
        }}
      >
        <span
          style={{
            fontFamily: "Roboto Mono",
            fontSize: "2rem",
            color: "rgba(0,0,0,70%)",
            padding: "2rem",
          }}
        >
          {url}
        </span>
      </section>
    </article>,
    {
      width,
      height,
      fonts: [
        {
          name: "Noto Sans JP",
          data: (await getFontData(
            "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400",
          )) as ArrayBuffer,
          style: "normal",
          weight: 400,
        },
        {
          name: "Noto Sans JP",
          data: (await getFontData(
            "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@600",
          )) as ArrayBuffer,
          style: "normal",
          weight: 600,
        },
        {
          name: "Roboto Mono",
          data: (await getFontData(
            "https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400",
          )) as ArrayBuffer,
          style: "normal",
          weight: 400,
        },
      ],
    },
  );

  return await sharp(Buffer.from(svg)).webp().toBuffer();
}

async function getFontData(api: string) {
  const css = await (
    await fetch(api, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    })
  ).text();

  const resource = css.match(
    /src: url\((.+)\) format\('(opentype|truetype)'\)/,
  );

  if (!resource || !resource[1]) return;

  return await fetch(resource[1]).then((res) => res.arrayBuffer());
}
