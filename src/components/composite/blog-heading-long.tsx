import { component$ } from "@builder.io/qwik";
import Typography from "~/components/display/typography";
import Badge from "~/components/display/badge";
import { Link } from "@builder.io/qwik-city";

export type Props = {
  blog: {
    title: string;
    date: string;
    text: string;
    category: string[];
    _meta: { path: string };
  };
  limit: number;
};

export default component$((props: Props) => {
  const { blog, limit } = props;
  const content =
    blog.text.length > limit ? `${blog.text.slice(0, limit)}……` : blog.text;
  return (
    <section>
      <header>
        <span class="text-sm text-gray-600">{blog.date}</span>
        <Link href={`/blog/${blog._meta.path}`}>
          <h3 class="text-lg font-bold underline">{blog.title}</h3>
        </Link>
      </header>
      <nav class="my-2">
        <ul>
          {blog.category.map((category) => (
            <Badge key={category} href={`/category/${category}`}>
              {category}
            </Badge>
          ))}
        </ul>
      </nav>
      <summary class="text-gray-600">
        <Typography>{content}</Typography>
      </summary>
    </section>
  );
});
