import { component$ } from "@builder.io/qwik";
import styles from "./work.module.css";

export interface WorkProps {
  company: {
    name: string;
    href: string;
  };
  start: Date;
  retire?: Date;
  position: string;
  topic: string;
}

export const Work = component$((props: WorkProps) => {
  return (
    <div class={styles.entry}>
      <span>
        <strong>{props.position}</strong>,
        <a href={props.company.href}>
          <strong>{props.company.name}</strong>
        </a>
        <date dateTime={props.start.toISOString()}>
          {props.start.getUTCFullYear()}/{props.start.getUTCMonth() + 1}
        </date>
        -
        {props.retire ? (
          <date dateTime={props.retire.toISOString()}>
            {props.retire.getUTCFullYear()}/{props.retire.getUTCMonth() + 1}
          </date>
        ) : (
          <em>present</em>
        )}
      </span>
      <span>{props.topic}</span>
    </div>
  );
});
