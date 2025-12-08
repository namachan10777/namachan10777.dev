import { $, component$, useSignal } from "@builder.io/qwik";
import Like from "~icons/iconoir/thumbs-up";
import * as v from "valibot";
import styles from "./styles.module.css";

interface Props {
  id: string;
  initial: number;
}

const validator = v.object({
  count: v.number(),
});

export const LikeButton = component$((props: Props) => {
  const countState = useSignal(props.initial);
  const handle = $(async () => {
    const response = await fetch(`/api/like/${props.id}`, {
      method: "POST",
    });
    const { count } = v.parse(validator, await response.json());
    countState.value = count;
  });
  return (
    <button aria-label="いいねする" onClick$={handle} class={styles.likeButton}>
      <Like class={styles.icon} />
      <span class={styles.count}>{countState.value}</span>
    </button>
  );
});
