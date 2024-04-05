import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import Icon from "~/assets/icon.webp?jsx";

const ProfileCard = () => (
  <section class="flex flex-row items-center gap-4">
    <div class="rounded-full overflow-hidden w-24 h-24">
      <Icon />
    </div>
    <div class="flex flex-col gap-2">
      <h1 class="text-4xl text-black">namachan10777</h1>
      <h2 class="text-2xl text-gray-600">Masaki Nakano</h2>
    </div>
  </section>);

export default component$(() => {
  return (
    <>
      <ProfileCard />
    </>
  );
});

export const head: DocumentHead = {
  title: "パターンに基づく",
  meta: [
    {
      name: "description",
      content: "Qwik site description",
    },
  ],
};
