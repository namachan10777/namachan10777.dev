import { component$ } from "@builder.io/qwik";
import styles from "./styles.module.css";
import LinkIcon from "~icons/iconoir/www";
import Internet from "~icons/iconoir/internet";
import * as rudis from "~/generated/rudis";

interface LinkCardProps {
  href: string;
  title: string;
  description: string;
  favicon: rudis.LinkCardImage | null;
}

export const LinkCard = component$((props: LinkCardProps) => {
  const { href, title, description, favicon } = props;
  const url = new URL(href);
  return (
    <a href={href} class={styles.root}>
      {favicon ? (
        <div class={styles.imageWrapper}>
          <img src={favicon.src} alt={title} width={400} height={400} />
        </div>
      ) : (
        <LinkIcon />
      )}
      <div class={styles.textWrapper}>
        <strong class={styles.title}>{title}</strong>
        <small class={styles.description}>{description}</small>
        <small class={styles.domain}>
          <Internet />
          {url.hostname}
        </small>
      </div>
    </a>
  );
});
