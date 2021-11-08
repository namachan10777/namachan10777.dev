import { chakra } from "@chakra-ui/react";
import Head from "next/head";
import React from "react";

import Header from "../components/header";
import NormalLink from "../components/normalLink";
import Articles from "../lib/articles";
import * as Parser from "../lib/parser";

export type Props = {
  frontmatters: Parser.DiaryFrontmatter[];
};

const Diary: React.FC<Props> = (props: Props) => {
  return (
    <chakra.div display="flex" alignItems="center" flexDir="column" w="full">
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
      <chakra.div
        fontSize={{ base: "base", lg: "lg" }}
        p={5}
        w="full"
        width={{ base: "90%", md: "60%" }}
      >
        <Header
          path={[
            ["namachan10777.dev", "/"],
            ["diary", "/diary"],
          ]}
        />
        <main>
          <chakra.h1 fontSize="4xl" fontWeight="bold" m={3}>
            Diary
          </chakra.h1>
          <chakra.ul fontSize="lg" listStyleType="disc" pl={5}>
            {props.frontmatters.map((frontmatter) => (
              <chakra.li key={frontmatter.date.toString()}>
                <NormalLink
                  href={`/diary/${frontmatter.date.toString()}`}
                  fontSize="lg"
                >
                  {frontmatter.date.toString()}
                </NormalLink>
              </chakra.li>
            ))}
          </chakra.ul>
        </main>
      </chakra.div>
    </chakra.div>
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
