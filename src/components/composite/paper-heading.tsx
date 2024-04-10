import { component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";

export type Props = {
  title: string;
  booktitle: string;
  year: number;
  href?: string | null;
};

export default component$((props: Props) => {
  return (
    <section>
      <header>
        <span class="text-sm text-gray-600">{props.year}</span>
        <h3 class="text-lg font-bold">
          {props.href ? (
            <Link class="underline" href={props.href}>
              {props.title}
            </Link>
          ) : (
            props.title
          )}
        </h3>
        <span class="text-gray-600">{props.booktitle}</span>
      </header>
    </section>
  );
});
