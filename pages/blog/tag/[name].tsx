import React from "react";
import Head from "next/head";
import Link from "next/link";
import Articles from "../../../lib/articles";
import * as Parser from "../../../lib/parser";
import { GetStaticPropsContext } from "next";

export type Props = {
  frontmatters: Parser.Frontmatter[];
  tag: string;
};

const Blog: React.FC<Props> = (props: Props) => {
  const ogImageUrl = `https://og-image-two-azure.vercel.app/${encodeURI(
    `#${props.tag}`
  )}.png?theme=dark&md=1&fontSize=100px`;
  return (
    <div className="flex items-center flex-col w-screen">
      <Head>
        <title>blog #{props.tag}</title>
        <meta name="description" content="namachan10777 blog page" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="twitter:image" content={ogImageUrl} />
        <meta property="twitter:site" content="@namachan10777" />
        <meta property="twitter:creator" content="@namachan10777" />
        <meta property="twitter:card" content="summary" />
        <meta
          property="og:image"
          content="https://www.namachan10777.dev/icon.webp"
        />
        <meta property="og:image" content={ogImageUrl} />
        <meta
          property="og:url"
          content={`https://www.namachan10777.dev/blog/tag/${props.tag}`}
        />
        <meta property="og:title" content="Blog" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="namachan10777.dev" />
        <meta property="og:description" content="namachan10777 blog page" />
      </Head>
      <div className="w-full lg:w-1/2 p-5">
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
          <h1 className="text-4xl font-bold m-3">#{props.tag}</h1>
          <ul className="pl-5 list-disc text-lg">
            {props.frontmatters.map((frontmatter) => (
              <li
                key={frontmatter.name}
                className="underline text-gray-700 hover:text-black hover:font-medium text-lg"
              >
                <Link href={`/blog/${frontmatter.name}`} passHref={true}>
                  {frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </main>
      </div>
    </div>
  );
};

export async function getStaticPaths() {
  const articles = await Articles();
  const tags = new Set(
    Object.values(articles.blogs)
      .map((article) => article.frontmatter.category)
      .flat()
  );
  return {
    paths: Array.from(tags).map((name) => `/blog/tag/${name}`),
    fallback: false,
  };
}

export async function getStaticProps(ctx: GetStaticPropsContext) {
  const params = ctx.params;
  const articles = await Articles();
  if (params) {
    return {
      props: {
        frontmatters: Object.values(articles.blogs)
          .map((blog) => blog.frontmatter)
          .filter((frontmatter) =>
            frontmatter.category.includes(params.name as string)
          ),
        tag: params.name,
      },
    };
  } else {
    return { notFound: true };
  }
}

export default Blog;
