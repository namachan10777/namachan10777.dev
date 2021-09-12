import React from "react";
import Head from "next/head";
import Md from "../../components/md";
import Link from "next/link";
import * as Parser from "../../lib/parser";
import blogOnNextJs from "../../articles/blog/blog-on-nextjs.md";

type Props = {
  article: Parser.Article;
};

export default function Home(props: Props) {
  return (
    <div className="flex items-center flex-col">
      <Head>
        <title>{props.article.frontmatter.title}</title>
        <meta name="description" content="namachan10777 profile page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="lg:w-1/2">
        <header>
          <Link href="/" passHref={true}>
            <a className="m-1 text-lg underline text-gray-700 hover:text-black">
              namachan10777.dev
            </a>
          </Link>{" "}
          {">"}
          <Link href="/blog" passHref={true}>
            <a className="m-1 text-lg underline text-gray-700 hover:text-black">
              Blog
            </a>
          </Link>
        </header>
        <main>
          <h1 className="text-4xl font-bold m-4">
            {props.article.frontmatter.title}
          </h1>
          <Md mdast={props.article.ast} />
        </main>
      </div>
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
