import { component$ } from "@builder.io/qwik";
import Typography from "../display/typography";

export type Props = {
  title: string;
  date: string;
  description: string;
};

export default component$((props: Props) => {
  return (
    <section class="flex flex-col gap-2">
      <header>
        <span class="text-sm text-gray-600">{props.date}</span>
        <h3 class="text-lg font-bold underline">{props.title}</h3>
      </header>
      <summary class="text-gray-600">
        <Typography>{props.description}</Typography>
      </summary>
    </section>
  );
});
