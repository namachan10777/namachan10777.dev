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

export function LinkCard(props: LinkCardProps) {
  const { href, title, description, favicon } = props;
  const url = new URL(href);
  return (
    <a href={href} className={styles.root}>
      {favicon ? (
        <div className={styles.imageWrapper}>
          <img src={favicon.src} alt={title} width={400} height={400} />
        </div>
      ) : (
        <LinkIcon />
      )}
      <div className={styles.textWrapper}>
        <strong className={styles.title}>{title}</strong>
        <small className={styles.description}>{description}</small>
        <small className={styles.domain}>
          <Internet />
          {url.hostname}
        </small>
      </div>
    </a>
  );
}
