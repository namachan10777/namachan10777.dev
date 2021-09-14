import React from "react";
import Head from "next/head";
import Link from "next/link";
import Articles from "../lib/articles";
import * as Parser from "../lib/parser";

export type Props = {
  frontmatters: Parser.Frontmatter[];
};

const Blog: React.FC<Props> = (props: Props) => {
  const tags = Array.from(
    new Set(
      props.frontmatters.map((frontmatter) => frontmatter.category).flat()
    )
  );
  return (
    <div className="flex items-center flex-col w-screen">
      <Head>
        <title>blog</title>
        <meta name="description" content="namachan10777 blog page" />
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
        <meta property="og:url" content="https://www.namachan10777.dev/blog" />
        <meta property="og:title" content="Blog" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="namachan10777.dev" />
        <meta property="og:description" content="namachan10777 blog page" />
      </Head>
      <div className="w-full lg:w-1/2 p-5">
        <header>
          <Link href="/" passHref={true}>
            <a className="underline text-gray-700 hover:text-black text-lg mx-1">
              namachan10777.dev
            </a>
          </Link>
        </header>
        <main>
          <h1 className="text-4xl font-bold m-3">Blog</h1>
          <section>
            <h2 className="text-2xl font-bold m-3">tag</h2>
            <ul className="pl-5 list-disc text-lg">
              {tags.map((tag) => (
                <li
                  key={tag}
                  className="underline text-gray-700 hover:text-black hover:font-medium text-lg my-2"
                >
                  <Link href={`/blog/tag/${tag}`} passHref={true}>
                    <a>#{tag}</a>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-2xl font-bold m-3">page</h2>
            <ul className="pl-5 list-disc text-lg">
              {props.frontmatters.map((frontmatter) => (
                <li
                  key={frontmatter.name}
                  className="underline text-gray-700 hover:text-black hover:font-medium text-lg my-2"
                >
                  <Link href={`/blog/${frontmatter.name}`} passHref={true}>
                    {frontmatter.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </div>
  );
};

export async function getStaticProps() {
  const articles = await Articles();
  return {
    props: {
      frontmatters: Object.values(articles.blogs).map(
        (blog) => blog.frontmatter
      ),
    },
  };
}

export default Blog;
