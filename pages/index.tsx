import { chakra } from "@chakra-ui/react";
import * as MdAst from "mdast";
import Head from "next/head";
import React from "react";

import index from "../articles/index.md";
import Footer from "../components/footer";
import Header from "../components/header";
import Md from "../components/md";
import metadata from "../lib/generated/metadata";
import * as Parser from "../lib/parser";

type Props = {
  mdast: MdAst.Root;
};

export default function Home(props: Props) {
  return (
    <chakra.div
      display="flex"
      alignItems="center"
      width={"100%"}
      flexDir={"column"}
    >
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
      <chakra.main
        p={5}
        fontSize={{ base: "md", md: "lg" }}
        width={{ base: "90%", md: "60%" }}
      >
        <Header path={[["namachan10777.dev", "/"]]} />
        <Md mdast={props.mdast} />
        <Footer metadata={metadata.index}></Footer>
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
