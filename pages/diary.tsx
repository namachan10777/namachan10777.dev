import React from "react";
import Head from "next/head";
import Link from "next/link";
import Articles from "../lib/articles";
import * as Parser from "../lib/parser";

export type Props = {
  frontmatters: Parser.DiaryFrontmatter[];
};

const Diary: React.FC<Props> = (props: Props) => {
  return (
    <div className="flex items-center flex-col w-screen">
      <Head>
        <title>diary</title>
        <meta name="description" content="namachan10777 diary page" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          property="twitter:image"
          content="https://www.namachan10777.dev/icon.webp"
        />
        <meta property="twitter:site" content="@namachan10777" />
        <meta property="twitter:creator" content="@namachan10777" />
        <meta property="twitter:card" content="summary" />
        <meta
          property="og:image"
          content="https://www.namachan10777.dev/icon.webp"
        />
        <meta property="og:url" content="https://www.namachan10777.dev/diary" />
        <meta property="og:title" content="Diary" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="namachan10777.dev" />
        <meta property="og:description" content="namachan10777 diary page" />
      </Head>
      <div className="w-full lg:w-1/2 p-5">
        <header>
          <Link href="/" passHref={true}>
            <a className="underline text-gray-700 hover:text-black text-lg m-1">
              namachan10777.dev
            </a>
          </Link>
        </header>
        <main>
          <h1 className="text-4xl font-bold m-3">Diary</h1>
          <ul className="pl-5 list-disc text-lg">
            {props.frontmatters.map((frontmatter) => (
              <li
                key={frontmatter.date.toString()}
                className="underline text-gray-700 hover:text-black hover:font-medium text-lg"
              >
                <Link
                  href={`/diary/${frontmatter.date.toString()}`}
                  passHref={true}
                >
                  {frontmatter.date.toString()}
                </Link>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
};

export async function getStaticProps() {
  const articles = await Articles();
  return {
    props: {
      frontmatters: Object.values(articles.diaries).map(
        (diary) => diary.frontmatter
      ),
    },
  };
}

export default Diary;
