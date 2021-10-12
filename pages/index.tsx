import React from "react";
import Head from "next/head";
import Md from "../components/md";
import * as MdAst from "mdast";
import * as Parser from "../lib/parser";
import index from "../articles/index.md";
import { chakra } from "@chakra-ui/react";

type Props = {
  mdast: MdAst.Root;
};

export default function Home(props: Props) {
  return (
    <chakra.div display="flex" justifyItems="center">
      <Head>
        <title>namachan10777</title>
        <meta name="description" content="namachan10777 profile page" />
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
        <meta property="og:url" content="https://www.namachan10777.dev" />
        <meta property="og:title" content="namachan10777.dev" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="namachan10777.dev" />
        <meta
          property="og:description"
          content="namachan10777 personal website"
        />
      </Head>
      <chakra.main p={5} fontSize={{ base: "md", md: "lg" }}>
        <Md mdast={props.mdast} />
      </chakra.main>
    </chakra.div>
  );
}

export async function getStaticProps() {
  const md = await Parser.parse(index);
  return {
    props: { mdast: md.ast },
  };
}
