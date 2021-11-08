import React from "react";
import Head from "next/head";
import Md from "../../components/md";
import * as Parser from "../../lib/parser";
import Articles from "../../lib/articles";
import { GetStaticPropsContext } from "next";
import { chakra } from "@chakra-ui/react";
import NormalLink from "../../components/normalLink";
import Header from "../../components/header";

type Props = {
  article: Parser.Diary;
};

export default function Home(props: Props) {
  return (
    <chakra.div display="flex" alignItems="center" flexDir="column" w="full">
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
      <chakra.div
        w="full"
        fontSize={{ base: "base", lg: "lg" }}
        p={5}
        width={{ base: "90%", md: "60%" }}
      >
        <Header
          path={[
            ["namachan10777.dev", "/"],
            ["diary", "/diary"],
            [
              `${props.article.frontmatter.date}`,
              `/diary/${props.article.frontmatter.date}`,
            ],
          ]}
        />
        <main>
          <chakra.h1 fontSize="4xl" fontWeight="bold" m={4}>
            {props.article.frontmatter.date.toString()}
          </chakra.h1>
          <Md mdast={props.article.ast} />
        </main>
      </chakra.div>
    </chakra.div>
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
