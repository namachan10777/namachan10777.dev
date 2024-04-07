import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Icon from "~/assets/icon.webp?jsx";

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
