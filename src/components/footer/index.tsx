import type { ReactNode } from "react";
import IconGitHub from "~icons/iconoir/github";
import IconLinkedIn from "~icons/iconoir/linkedin";
import IconX from "~icons/iconoir/x";
import * as styles from "./styles.css";

function LinkIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={styles.linkIcon} aria-label={label}>
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <address className={styles.content}>
        <small>@namachan10777</small>
        <nav className={styles.nav}>
          <LinkIcon
            href="https://github.com/namachan10777"
            label="GitHubのアカウントへのリンク"
          >
            <IconGitHub />
          </LinkIcon>
          <LinkIcon
            href="https://x.com/namachan10777"
            label="X(Twitter)のアカウントへのリンク"
          >
            <IconX />
          </LinkIcon>
          <LinkIcon
            href="https://www.linkedin.com/in/masaki-nakano-667493163/"
            label="LinkedInのアカウントへのリンク"
          >
            <IconLinkedIn />
          </LinkIcon>
        </nav>
      </address>
    </footer>
  );
}
