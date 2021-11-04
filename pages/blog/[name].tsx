import React from "react";
import Head from "next/head";
import Md from "../../components/md";
import * as Parser from "../../lib/parser";
import Articles from "../../lib/articles";
import { GetStaticPropsContext } from "next";
import { chakra } from "@chakra-ui/react";
import NormalLink from "../../components/normalLink";

type Props = {
  article: Parser.Article;
};

export default function Home(props: Props) {
  const ogImageUrl = `https://og-image-two-azure.vercel.app/${encodeURI(
    props.article.frontmatter.title
  )}.png?theme=dark&md=1&fontSize=100px`;
  return (
    <chakra.div display="flex" alignItems="center" flexDir="column" w="full">
      <Head>
        <title>{props.article.frontmatter.title}</title>
        <meta name="description" content="namachan10777 blog page" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="twitter:image" content={ogImageUrl} />
        <meta property="twitter:site" content="@namachan10777" />
        <meta property="twitter:creator" content="@namachan10777" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="og:image" content={ogImageUrl} />
        <meta
          property="og:url"
          content={`https://www.namachan10777.dev/blog/${props.article.frontmatter.name}`}
        />
        <meta property="og:title" content={props.article.frontmatter.title} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="namachan10777.dev" />
        <meta property="og:description" content="namachan10777 blog page" />
      </Head>
      <chakra.div
        w="full"
        p={5}
        fontSize={{ base: "base", lg: "lg" }}
        width={{ base: "90%", md: "60%" }}
      >
        <header>
          <NormalLink href="/" fontSize="lg">
            namachan10777.dev
          </NormalLink>
          {" >"}
          <NormalLink href="/blog" fontSize="lg">
            Blog
          </NormalLink>
        </header>
        <main>
          <chakra.h1 fontSize="4xl" fontFamily="mono" fontWeight="bold" my={4}>
            # {props.article.frontmatter.title}
          </chakra.h1>
          <div>
            {props.article.frontmatter.category.map((tag) => (
              <NormalLink key={tag} href={`/blog/tag/${tag}`} fontSize="lg">
                #{tag}
              </NormalLink>
            ))}
          </div>
          <Md mdast={props.article.ast} />
        </main>
      </chakra.div>
    </chakra.div>
  );
}

export async function getStaticPaths() {
  const articles = await Articles();
  return {
    paths: Object.keys(articles.blogs).map((name) => `/blog/${name}`),
    fallback: false,
  };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  const articles = await Articles();
  const params = ctx.params;
  if (params) {
    return {
      props: { article: articles.blogs[params.name as string] },
    };
  } else {
    return {
      notFound: true,
    };
  }
}
