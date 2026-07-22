import type { ReactNode } from "react";
import { PaginationNav } from "~/components/pagination-nav";
import { PostList } from "~/components/post-list";
import type { PostSummary } from "~/lib/posts";
import styles from "./styles.module.css";

interface PaginatedPostListProps {
  children: ReactNode;
  contents: PostSummary[];
  prev?: string;
  next?: string;
}

export function PaginatedPostList(props: PaginatedPostListProps) {
  return (
    <div className={styles.container}>
      <div>{props.children}</div>
      <div>
        <PostList posts={props.contents} />
      </div>
      <div className={styles.navContainer}>
        <PaginationNav prev={props.prev} next={props.next} />
      </div>
    </div>
  );
}
