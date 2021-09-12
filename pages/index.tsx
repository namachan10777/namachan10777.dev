import React from "react";
import Head from "next/head";
import Md from "../components/md";
import * as Parser from '../lib/parser';
import index from "../articles/index.md";

type Props = {
  mdast: MdAst.Root;
};

export default function Home(props: Props) {
  return (
    <div>
      <Head>
        <title>namachan10777</title>
        <meta name="description" content="namachan10777 profile page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="p-5">
        <Md mdast={props.mdast} />
      </main>
    </div>
  );
}

export async function getStaticProps() {
  const md = await Parser.parse(index);
  return {
    props: { mdast: md.ast },
  };
}
