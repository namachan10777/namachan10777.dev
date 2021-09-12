import router from "next/router";
import React from "react";
import Head from "next/head";
import Md from "../../components/md";
import * as Parser from "../../lib/parser";
import index from "../../articles/index.md";
import blogOnNextJs from "../../articles/blog/blog-on-nextjs.md";

type Props = {
  article: Parser.Article;
};

export default function Home(props: Props) {
  return (
    <div>
      <Head>
        <title>{props.article.frontmatter.title}</title>
        <meta name="description" content="namachan10777 profile page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-5">
        <h1 className="text-4xl font-bold m-4">
          {props.article.frontmatter.title}
        </h1>
        <Md mdast={props.article.ast} />
      </main>
    </div>
  );
}

export async function getStaticPaths() {
  return {
    paths: ["/blog/blog-on-nextjs"],
    fallback: false,
  };
}

export async function getStaticProps() {
  const md = await Parser.parse(blogOnNextJs);
  return {
    props: { article: md },
  };
}
