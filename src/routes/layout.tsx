import { Slot, component$ } from "@builder.io/qwik";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import styles from "./layout.module.css";

export default component$(() => {
  return (
    <div class={styles.container}>
      <Header />
      <main class={styles.main}>
        <div class={styles.content}>
          <Slot />
        </div>
      </main>
      <Footer />
    </div>
  );
});
