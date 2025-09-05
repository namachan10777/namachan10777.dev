import { Slot, component$ } from "@builder.io/qwik";
import styles from "./heading.module.css";
import Link from "~icons/iconoir/link";

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export const Heading = component$(
  ({
    tag,
    slug,
  }: {
    tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    slug: string;
  }) => {
    const Tag = tag;
    return (
      <Tag id={slug} class={styles.heading}>
        <Slot />
        <a
          href={`#${slug}`}
          class={styles.headingAnchor}
          aria-label={`このセクション(${slug})へのリンク`}
        >
          <Link />
        </a>
      </Tag>
    );
  },
);
