import { downloadGoogleFont } from "@lib/google-font-download";
import { renderDate } from "@lib/util";
import { ImageResponse } from "@vercel/og";

export interface Article {
  title: string;
  description: string | string[];
  date?: Date;
  url: string;
}

const notoSansRegular = await downloadGoogleFont({
  family: "Noto Sans JP",
  weight: 400,
});
const notoSansBold = await downloadGoogleFont({
  family: "Noto Sans JP",
  weight: 700,
});

export async function ogArticlePreviewSVG(
  article: Article,
): Promise<ImageResponse> {
  const response = new ImageResponse(
    (
      <article
        tw="flex flex-col justify-between h-full px-8 py-6 w-full bg-white"
        style={{ fontFamily: "Noto Sans" }}
      >
        <div tw="flex flex-col">
          <header tw="flex flex-col">
            <h1 tw="font-bold text-5xl flex flex-row items-end">
              <span tw="text-4xl mr-2 text-gray-600">#</span>
              <span>{article.title}</span>
            </h1>
            {article.date && (
              <span tw="font-mono text-2xl text-gray-600">
                {renderDate("day", article.date)}
              </span>
            )}
          </header>
          {article.description instanceof Array ? (
            <ul tw="flex flex-col gap-4">
              {article.description.map((desc) => (
                <li tw="text-2xl" key={desc}>
                  {desc}
                </li>
              ))}
            </ul>
          ) : (
            <p tw="text-2xl">{article.description}</p>
          )}
        </div>
        <footer tw="flex flex-row justify-end w-full text-2xl">
          {article.url}
        </footer>
      </article>
    ),
    {
      fonts: [
        {
          name: "Noto Sans",
          data: notoSansRegular,
          style: "normal",
          weight: 400,
        },
        {
          name: "Noto Sans",
          data: notoSansBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
  return response;
}
