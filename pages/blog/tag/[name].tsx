import React from "react";
import Head from "next/head";
import Link from "next/link";
import Articles from "../../../lib/articles";
import * as Parser from "../../../lib/parser";
import { GetStaticPropsContext } from "next";
import { chakra } from "@chakra-ui/react";

export type Props = {
  frontmatters: Parser.Frontmatter[];
  tag: string;
};

const Blog: React.FC<Props> = (props: Props) => {
  const ogImageUrl = `https://og-image-two-azure.vercel.app/${encodeURI(
    `#${props.tag}`
  )}.png?theme=dark&md=1&fontSize=100px`;
  return (
    <chakra.div display="flex" alignItems="center" flexDir="column" w="full">
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
      <chakra.div w="full" fontSize={{ base: "base", lg: "lg" }} p={5}>
        <header>
          <Link href="/" passHref={true}>
            <chakra.a
              textDecor="underline"
              fontSize="lg"
              color="gray.700"
              m={1}
              _hover={{ color: "black", fontWeight: "meduim" }}
            >
              namachan10777.dev
            </chakra.a>
          </Link>{" "}
          {">"}
          <Link href="/blog" passHref={true}>
            <chakra.a
              textDecor="underline"
              fontSize="lg"
              color="gray.700"
              m={1}
              _hover={{ color: "black", fontWeight: "meduim" }}
            >
              Blog
            </chakra.a>
          </Link>
        </header>
        <main>
          <chakra.h1 fontSize="4xl" fontWeight="bold" m={3}>
            #{props.tag}
          </chakra.h1>
          <chakra.ul fontSize="lg" listStyleType="disc" pl={5}>
            {props.frontmatters.map((frontmatter) => (
              <chakra.li
                key={frontmatter.name}
                textDecor="underline"
                fontSize="lg"
                color="gray.700"
                my={2}
                _hover={{ color: "black", fontWeight: "meduim" }}
              >
                <Link href={`/blog/${frontmatter.name}`} passHref={true}>
                  {frontmatter.title}
                </Link>
              </chakra.li>
            ))}
          </chakra.ul>
        </main>
      </chakra.div>
    </chakra.div>
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
