import { component$ } from "@builder.io/qwik";
import styles from "./link-card.module.css";
import LinkIcon from "~icons/iconoir/www";

interface Image {
  url: string;
  width: number;
  height: number;
}

export const IsolatedLink = component$(
  ({
    href,
    title,
    description,
    favicon,
  }: {
    href: string;
    title: string;
    description: string;
    favicon: string | null;
    image: Image | null;
  }) => {
    return (
      <a href={href} class={styles.root}>
        {favicon ? (
          <div class={styles.imageWrapper}>
            <img src={favicon} alt={title} width={400} height={400} />
          </div>
        ) : (
          <LinkIcon />
        )}
        <div class={styles.textWrapper}>
          <h6 class={styles.title}>{title}</h6>
          <small class={styles.description}>{description}</small>
        </div>
      </a>
    );
  },
);
