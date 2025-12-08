import { Slot, component$ } from "@builder.io/qwik";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import { NavigationIndicator } from "~/components/navigation-indicator";
import styles from "./layout.module.css";

export default component$(() => {
  return (
    <div class={styles.container}>
      <NavigationIndicator />
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
