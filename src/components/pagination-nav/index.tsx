import { Link } from "react-router";
import LeftIcon from "~icons/iconoir/arrow-left";
import RightIcon from "~icons/iconoir/arrow-right";
import * as styles from "./styles.css";

export function PaginationNav({
  next,
  prev,
}: {
  next?: string;
  prev?: string;
}) {
  return (
    <nav className={styles.nav}>
      {prev && (
        <Link className={styles.prev} to={prev}>
          <LeftIcon />
          Prev
        </Link>
      )}
      {next && (
        <Link className={styles.next} to={next}>
          Next
          <RightIcon />
        </Link>
      )}
    </nav>
  );
}
