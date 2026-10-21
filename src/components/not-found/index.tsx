import * as styles from "./styles.css";

export function NotFound() {
  return (
    <section className={styles.container}>
      <span className={styles.code}>Error 404</span>
      <h1>Page Not Found</h1>
      <p>ページが見つかりません</p>
    </section>
  );
}
