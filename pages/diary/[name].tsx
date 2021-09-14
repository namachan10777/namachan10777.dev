import React from "react";
import Head from "next/head";
import Md from "../../components/md";
import Link from "next/link";
import * as Parser from "../../lib/parser";
import Articles from "../../lib/articles";
import { GetStaticPropsContext } from "next";

type Props = {
  article: Parser.Diary;
};

export default function Home(props: Props) {
  return (
    <div className="flex items-center flex-col w-screen">
      <Head>
        <title>{props.article.frontmatter.date.toString()}</title>
        <meta name="description" content="namachan10777 diary page" />
        <link rel="icon" href="/favicon.ico" />
        <meta
          property="twitter:image"
          content={`https://og-image-two-azure.vercel.app/${encodeURI(
            `日記 ${props.article.frontmatter.date.toString()}`
          )}.png?theme=dark&md=1&fontSize=100px`}
        />
        <meta property="twitter:site" content="@namachan10777" />
        <meta property="twitter:creator" content="@namachan10777" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="og:image"
          content={`https://og-image-two-azure.vercel.app/${encodeURI(
            `日記 ${props.article.frontmatter.date.toString()}`
          )}.png?theme=dark&md=1&fontSize=100px`}
        />
        <meta
          property="og:url"
          content={`https://www.namachan10777.dev/diary/${props.article.frontmatter.date.toString()}`}
        />
        <meta
          property="og:title"
          content={props.article.frontmatter.date.toString()}
        />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="namachan10777.dev" />
        <meta property="og:description" content="namachan10777 diary page" />
      </Head>
      <div className="w-full lg:w-1/2 p-5">
        <header>
          <Link href="/" passHref={true}>
            <a className="m-1 text-lg underline text-gray-700 hover:text-black">
              namachan10777.dev
            </a>
          </Link>{" "}
          {">"}
          <Link href="/diary" passHref={true}>
            <a className="m-1 text-lg underline text-gray-700 hover:text-black">
              Diary
            </a>
          </Link>
        </header>
        <main>
          <h1 className="text-4xl font-bold m-4">
            {props.article.frontmatter.date.toString()}
          </h1>
          <Md mdast={props.article.ast} />
        </main>
      </div>
    </div>
  );
}

export async function getStaticPaths() {
  const articles = await Articles();
  return {
    paths: Object.keys(articles.diaries).map((name) => `/diary/${name}`),
    fallback: false,
  };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  const articles = await Articles();
  const params = ctx.params;
  if (params) {
    return {
      props: { article: articles.diaries[params.name as string] },
    };
  } else {
    return {
      notFound: true,
    };
  }
}
