import styles from "./styles.module.css";

export function NotFound() {
  return (
    <section className={styles.container}>
      <h1>Page Not Found</h1>
      <p>ページが見つかりません</p>
    </section>
  );
}
