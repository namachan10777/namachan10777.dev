import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { allBlogs, allPapers } from "content-collections";
import Icon from "~/assets/icon.webp?jsx";
import BlogHeadingShort from "~/components/composite/blog-heading-short";
import PaperHeading from "~/components/composite/paper-heading";
import Timeline from "~/components/composite/timeline";
import Section from "~/components/container/section";
import Heading from "~/components/display/heading";
import InlineCode from "~/components/display/inline-code";
import Typography from "~/components/display/typography";
import { ogMetaTags } from "~/lib/og-meta-tags";

const ProfileCard = () => (
  <section class="flex flex-col items-center gap-4">
    <div class="h-24 w-24 overflow-hidden rounded-full">
      <Icon />
    </div>
    <div class="flex flex-col items-center gap-2">
      <h1 class="text-3xl font-bold text-black">namachan10777</h1>
      <h2 class="text-2xl text-gray-600">Masaki Nakano</h2>
    </div>
  </section>
);

const LatestBlogs = (props: { blogs: typeof allBlogs; limit: number }) => {
  const latestBlogs = props.blogs
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .slice(0, Math.min(props.limit, allBlogs.length));
  return (
    <nav>
      <ul class="flex flex-col gap-4">
        {latestBlogs.map((blog) => (
          <li key={blog._meta.fileName}>
            <a href={`/blog/${blog._meta.fileName}`}>
              <BlogHeadingShort
                title={blog.title}
                description={blog.description}
                date={blog.date}
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

const Papers = (props: { papers: typeof allPapers }) => {
  const papers = props.papers.sort((a, b) => b.year - a.year);
  return (
    <nav>
      <ul class="flex flex-col gap-4">
        {papers.map((paper) => (
          <li key={paper._meta.fileName}>
            <PaperHeading
              title={paper.title}
              href={paper.href}
              year={paper.year}
              booktitle={paper.booktitle}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
};

const events = [
  { date: "2015-04", title: "香川高等専門学校 機械工学科入学" },
  { date: "2016-04", title: "香川高等専門学校 電気情報工学科転科" },
  {
    date: "2020-03",
    title: "日本音響学会 春季研究発表会 ポスター発表",
  },
  { date: "2020-03", title: "香川高等専門学校 電気情報工学科卒業" },
  { date: "2020-04", title: "筑波大学 情報学群 情報科学類入学" },
  {
    date: "2021-09",
    title: "クックパッド株式会社 就業型インターン(SRE) (現在退職)",
  },
  {
    date: "2021-12",
    title: "Taiwan Now! 蘭の舟ロボット設計・開発（電装系）",
  },
  {
    date: "2022-09",
    title: "京都府広域アートプロジェクト 照明システム開発",
  },
  {
    date: "2023-12",
    title: "横浜 ヨルノヨ Web音楽同期、照明制御",
  },
  {
    date: "2023-08",
    title: "株式会社ArkEdge Space インターン（在職）",
  },
];

export default component$(() => {
  return (
    <>
      <div class="w-full p-4">
        <ProfileCard />
      </div>
      <Section depth={2}>
        <Heading level={2}>Profile</Heading>
        <Typography>
          分散ストレージ、KVSなどソフトウェア技術で実現されるデータの永続化、
          カーネル空間のバイパスによる高速でポータブルなIOスタック、
          非同期ランタイムなどによるOS機能のユーザランドへの移転に興味があります。
        </Typography>
      </Section>
      <Section depth={2}>
        <Heading level={2}>Region</Heading>
        <address class="not-italic">
          <InlineCode>ap-northeast-1</InlineCode>
        </address>
      </Section>
      <Section depth={2}>
        <Heading level={2}>Timeline</Heading>
        <Timeline events={events} />
      </Section>
      <Section depth={2}>
        <Heading level={2}>Blog</Heading>
        <LatestBlogs blogs={allBlogs} limit={5} />
      </Section>
      <Section depth={2}>
        <Heading level={2}>Papers</Heading>
        <Papers papers={allPapers} />
      </Section>
    </>
  );
});

export const head: DocumentHead = ({ url }) => ({
  title: "/var/log/namachan-10777.log",
  meta: [
    {
      name: "description",
      content: "namachan10777のプロフィールとブログ",
    },
    ...ogMetaTags({
      title: "/var/log/namachan-10777.log",
      description: "namachan10777のプロフィールとブログ",
      imgUrl: `${url}og.webp`,
      type: "profile",
      twitter: {
        imgType: "summary_large_image",
        username: "namachan10777",
      },
    }),
  ],
});
