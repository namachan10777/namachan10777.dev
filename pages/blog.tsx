import React from "react";
import Head from "next/head";
import Link from 'next/link';
import * as Parser from '../lib/parser';
import blogOnNextJs from '../articles/blog/blog-on-nextjs.md';

export type Props = {
    frontmatters: Parser.Frontmatter[]
};

const Blog: React.FC<Props> = (props: Props) => {
    return <div>
        <Head>
            <title>blog</title>
            <meta name="description" content="namachan10777 profile page" />
            <link rel="icon" href="/favicon.ico" />
        </Head>
        <main>
            <h1 className="text-4xl font-bold m-3">Blog</h1>
            <ul className="pl-5 list-disc text-lg">
                {props.frontmatters.map((frontmatter) =>
                  <li key={frontmatter.name} className="underline text-gray-700 hover:text-black hover:font-medium text-lg" >
                    <Link href={`/blog/${frontmatter.name}`} passHref={true}>{frontmatter.title}</Link>
                  </li>)
                }
            </ul>
        </main>
    </div>;
};

const markdowns = [blogOnNextJs];

export async function getStaticProps() {
    const blogs = await Promise.all(markdowns.map(Parser.parse));
    return {
        props: {
            frontmatters: blogs.map(blog => blog.frontmatter)
        }
    }
}



export default Blog;