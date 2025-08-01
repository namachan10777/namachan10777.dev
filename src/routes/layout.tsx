import { Slot, component$ } from "@builder.io/qwik";
import IconGitHub from "~icons/iconoir/github";
import IconX from "~icons/iconoir/x";
import IconLinkedIn from "~icons/iconoir/linkedin";
import styles from "./layout.module.css";
import { Link } from "@builder.io/qwik-city";

const Header = component$(() => {
  return (
    <header class={[styles.adjustWidthContainer, styles.header]}>
      <div class={[styles.adjustWidth, styles.headerContent]}>
        <Link class={styles.headerLink} href="/">
          namachan10777.dev
        </Link>
      </div>
    </header>
  );
});

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

const Footer = component$(() => {
  return (
    <footer class={[styles.adjustWidthContainer, styles.footer]}>
      <div class={[styles.adjustWidth, styles.footerContent]}>
        <small>@namachan10777</small>
        <nav class={styles.footerNav}>
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

export default component$(() => {
  return (
    <div class={styles.container}>
      <Header />
      <main class={styles.adjustWidthContainer}>
        <div class={styles.adjustWidth}>
          <Slot />
        </div>
      </main>
      <Footer />
    </div>
  );
});
