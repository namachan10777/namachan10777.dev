import { Link } from "react-router";
import * as styles from "./styles.css";

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <Link className={styles.logo} to="/">
          namachan10777.dev
        </Link>
        <nav>
          <ul className={styles.nav}>
            <li>
              <Link className={styles.navLink} to="/post/page/1">
                Posts
              </Link>
            </li>
            <li>
              <a className={styles.navLink} href="/rss.xml">
                RSS
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
