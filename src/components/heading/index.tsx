import type { ReactNode } from "react";
import LinkIcon from "~icons/iconoir/link";
import styles from "./styles.module.css";

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export function Heading({
  tag,
  slug,
  children,
}: {
  tag: HeadingTag;
  slug: string;
  children: ReactNode;
}) {
  const Tag = tag;
  return (
    <Tag id={slug} className={styles.heading}>
      {children}
      <a
        href={`#${slug}`}
        className={styles.headingAnchor}
        aria-label={`このセクション(${slug})へのリンク`}
      >
        <LinkIcon />
      </a>
    </Tag>
  );
}
