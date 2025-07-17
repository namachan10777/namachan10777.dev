import { Slot, component$ } from "@builder.io/qwik";
import { PostList } from "./post-list";
import { PaginationNav } from "./pagination-nav";
import styles from "./paginated-post-list.module.css";

interface PaginatedPostListProps {
  contents: {
    id: string;
    title: string;
    description: string;
    published: Date;
    tags: string[];
  }[];
  prev?: string;
  next?: string;
}

export const PaginatedPostList = component$((props: PaginatedPostListProps) => {
  return (
    <div class={styles.container}>
      <div>
        <Slot />
      </div>
      <div>
        <PostList posts={props.contents} />
      </div>
      <div class={styles.navContainer}>
        <PaginationNav prev={props.prev} next={props.next} />
      </div>
    </div>
  );
});
