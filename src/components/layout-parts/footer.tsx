import { component$ } from "@builder.io/qwik";

export default component$(() => {
  return <footer class="w-full h-full flex items-center justify-center text-sm text-gray-600">
    ©2021-{new Date().getFullYear()} Masaki Nakano
  </footer>
});