import { Slot, component$ } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import IconGitHub from "~icons/iconoir/github";
import IconX from "~icons/iconoir/x";
import IconLinkedIn from "~icons/iconoir/linkedin";
import styles from "./styles.module.css";

interface LinkIconProps {
  href: string;
  label: string;
}

const LinkIcon = component$((props: LinkIconProps) => {
  return (
    <Link href={props.href} class={styles.linkIcon} aria-label={props.label}>
      <Slot />
    </Link>
  );
});

export const Footer = component$(() => {
  return (
    <footer class={styles.footer}>
      <div class={styles.content}>
        <small>@namachan10777</small>
        <nav class={styles.nav}>
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
      </div>
    </footer>
  );
});
