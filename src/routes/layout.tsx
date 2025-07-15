import { Slot, component$ } from "@builder.io/qwik";
import IconGitHub from "~icons/iconoir/github";
import IconX from "~icons/iconoir/x";
import IconLinkedIn from "~icons/iconoir/linkedin";
import styles from "./layout.module.css";
import { SearchDialog } from "~/components/search-dialog";

const Header = component$(() => {
  return (
    <header class={[styles.adjustWidthContainer, styles.header]}>
      <div class={styles.adjustWidth}>
        <a class={styles.headerLink} href="/">
          namachan10777.dev
        </a>
        <SearchDialog />
      </div>
    </header>
  );
});

interface LinkIconProps {
  href: string;
}

const LinkIcon = component$((props: LinkIconProps) => {
  return (
    <a href={props.href} class={styles.linkIcon}>
      <Slot />
    </a>
  );
});

const Footer = component$(() => {
  return (
    <footer class={[styles.adjustWidthContainer, styles.footer]}>
      <div class={[styles.adjustWidth, styles.footerContent]}>
        <small>@namachan10777</small>
        <nav class={styles.footerNav}>
          <LinkIcon href="https://github.com/namachan10777">
            <IconGitHub />
          </LinkIcon>
          <LinkIcon href="https://x.com/namachan10777">
            <IconX />
          </LinkIcon>
          <LinkIcon href="https://www.linkedin.com/in/masaki-nakano-667493163/">
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
