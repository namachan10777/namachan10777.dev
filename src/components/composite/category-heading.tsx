import { component$, useStylesScoped$ } from "@builder.io/qwik";
import styles from "./category-title.css?inline";

export type Props = {
  category: string;
  articles: { title: string; path: string }[];
};

export default component$((props: Props) => {
  useStylesScoped$(styles);
  return (
    <section>
      <header>
        <h2 class="category-title text-2xl font-bold">{props.category}</h2>
      </header>
      <ul class="flex flex-col gap-2 py-2">
        {props.articles.map((article) => (
          <li key={article.path}>
            <a href={article.path} class="text-blue-700 underline">
              {article.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
});
