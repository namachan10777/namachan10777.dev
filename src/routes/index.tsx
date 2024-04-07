import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Icon from "~/assets/icon.webp?jsx";
import Section from "~/components/container/section";
import Heading from "~/components/display/heading";
import InlineCode from "~/components/display/inline-code";
import Typography from "~/components/display/typography";

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

export default component$(() => {
  return (
    <>
      <div class="w-full p-4">
        <ProfileCard />
      </div>
      <Section>
        <Heading level={2}>Profile</Heading>
        <Typography>
          分散ストレージ、KVSなどソフトウェア技術で実現されるデータの永続化、
          カーネル空間のバイパスによる高速でポータブルなIOスタック、
          非同期ランタイムなどによるOS機能のユーザランドへの移転に興味があります。
        </Typography>
      </Section>
      <Section>
        <Heading level={2}>Region</Heading>
        <address>
          <InlineCode>ap-northeast-1</InlineCode>
        </address>
      </Section>
      <Section>
        <Heading level={2}>Timeline</Heading>
      </Section>
      <Section>
        <Heading level={2}>Blog</Heading>
      </Section>
      <Section>
        <Heading level={2}>Papers</Heading>
      </Section>
    </>
  );
});

export const head: DocumentHead = {
  title: "/var/log/namachan-10777.log",
  meta: [
    {
      name: "description",
      content: "namachan10777のプロフィールとブログ",
    },
  ],
};
