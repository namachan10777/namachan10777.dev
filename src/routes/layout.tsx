import { Slot, component$ } from "@builder.io/qwik";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import { NavigationProgress } from "~/components/navigation-progress";
import styles from "./layout.module.css";

export default component$(() => {
  return (
    <div class={styles.container}>
      <NavigationProgress />
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
