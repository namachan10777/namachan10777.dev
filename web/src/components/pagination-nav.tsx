import { component$ } from "@builder.io/qwik";
import styles from "./pagination-nav.module.css";
import RightIcon from "~icons/iconoir/arrow-right";
import LeftIcon from "~icons/iconoir/arrow-left";

export const PaginationNav = component$(
  (props: { next?: string; prev?: string }) => {
    return (
      <nav class={styles.nav}>
        {props.prev && (
          <a class={styles.prev} href={props.prev}>
            <LeftIcon />
            Prev
          </a>
        )}
        {props.next && (
          <a class={styles.next} href={props.next}>
            Next
            <RightIcon />
          </a>
        )}
      </nav>
    );
  },
);
