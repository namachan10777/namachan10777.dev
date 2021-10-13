import React from "react";
import Head from "next/head";
import Link from "next/link";
import Articles from "../lib/articles";
import { chakra } from "@chakra-ui/react";
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
    <chakra.div display="flex" alignItems="center" flexDir="column" w="full">
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
      <chakra.div w="full" fontSize={{ base: "md", lg: "lg" }} p={5}>
        <header>
          <Link href="/" passHref={true}>
            <chakra.a
              textDecor="underline"
              color="gray.700"
              _hover={{ color: "black" }}
              fontSize="lg"
              mx={1}
            >
              namachan10777.dev
            </chakra.a>
          </Link>
        </header>
        <main>
          <chakra.h1 fontSize="4xl" fontWeight="bold" m={3}>
            Blog
          </chakra.h1>
          <section>
            <chakra.h2 fontSize="2xl" fontWeight="bold" m={3}>
              tag
            </chakra.h2>
            <chakra.ul fontSize="lg" pl={5} listStyleType="disc">
              {tags.map((tag) => (
                <chakra.li
                  key={tag}
                  textDecor="underline"
                  fontSize="lg"
                  color="gray.700"
                  my={2}
                  _hover={{
                    color: "black",
                    fontWeight: "medium",
                  }}
                >
                  <Link href={`/blog/tag/${tag}`} passHref={true}>
                    <a>#{tag}</a>
                  </Link>
                </chakra.li>
              ))}
            </chakra.ul>
          </section>
          <section>
            <chakra.h2 fontSize="2xl" fontWeight="bold" m={3}>
              page
            </chakra.h2>
            <chakra.ul fontSize="lg" pl={5} listStyleType="disc">
              {props.frontmatters.map((frontmatter) => (
                <chakra.li
                  key={frontmatter.name}
                  textDecor="underline"
                  fontSize="lg"
                  color="gray.700"
                  my={2}
                  _hover={{ color: "black", fontWeight: "medium" }}
                >
                  <Link href={`/blog/${frontmatter.name}`} passHref={true}>
                    {frontmatter.title}
                  </Link>
                </chakra.li>
              ))}
            </chakra.ul>
          </section>
        </main>
      </chakra.div>
    </chakra.div>
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
