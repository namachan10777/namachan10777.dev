import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Icon from "~/assets/icon.webp?jsx";

const ProfileCard = () => (
  <section class="flex flex-row items-center gap-4">
    <div class="h-24 w-24 overflow-hidden rounded-full">
      <Icon />
    </div>
    <div class="flex flex-col gap-2">
      <h1 class="text-4xl text-black">namachan10777</h1>
      <h2 class="text-2xl text-gray-600">Masaki Nakano</h2>
    </div>
  </section>
);

export default component$(() => {
  return (
    <>
      <ProfileCard />
    </>
  );
});

export const head: DocumentHead = {
  title: "恐竜はシンプルに死んで絶滅した",
  meta: [
    {
      name: "description",
      content: "namachan10777のプロフィールとブログ",
    },
  ],
};
