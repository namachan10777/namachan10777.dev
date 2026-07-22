import type { ReactNode } from "react";
import { Footer } from "~/components/footer";
import { Header } from "~/components/header";
import { NavigationIndicator } from "~/components/navigation-indicator";
import styles from "./layout.module.css";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.container}>
      <NavigationIndicator />
      <Header />
      <main className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>
      <Footer />
    </div>
  );
}
