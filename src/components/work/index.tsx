import { formatYearMonth } from "~/lib/format";
import styles from "./styles.module.css";

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

export function Work(props: WorkProps) {
  return (
    <div className={styles.entry}>
      <span>
        <strong>{props.position}</strong>,
        <a href={props.company.href}>
          <strong>{props.company.name}</strong>
        </a>
        <time dateTime={props.start.toISOString()}>
          {formatYearMonth(props.start)}
        </time>
        -
        {props.retire ? (
          <time dateTime={props.retire.toISOString()}>
            {formatYearMonth(props.retire)}
          </time>
        ) : (
          <em>present</em>
        )}
      </span>
      <span>{props.topic}</span>
    </div>
  );
}
