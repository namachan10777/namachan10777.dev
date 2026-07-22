import { useState } from "react";
import * as v from "valibot";
import Like from "~icons/iconoir/thumbs-up";
import styles from "./styles.module.css";

const validator = v.object({ count: v.number() });

export function LikeButton({ id, initial }: { id: string; initial: number }) {
  const [count, setCount] = useState(initial);
  const handleClick = async () => {
    const response = await fetch(`/api/like/${id}`, { method: "POST" });
    setCount(v.parse(validator, await response.json()).count);
  };

  return (
    <button
      aria-label="いいねする"
      onClick={() => void handleClick()}
      className={styles.likeButton}
    >
      <Like className={styles.icon} />
      <span className={styles.count}>{count}</span>
    </button>
  );
}
