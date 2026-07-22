import { formatYearMonth } from "~/lib/format";
import * as styles from "./styles.css";

export interface EducationProps {
  degree: string;
  school: {
    name: string;
    href: string;
  };
  acquisition?: Date;
  start: Date;
  advisor: {
    name: string;
    href: string;
    position: string;
  };
  topic: string;
}

export function Education(props: EducationProps) {
  return (
    <div className={styles.entry}>
      <span>
        <strong>{props.degree}</strong>,
        <a href={props.school.href}>{props.school.name}</a>,
        <time dateTime={props.start.toISOString()}>
          {formatYearMonth(props.start)}
        </time>
        -
        {props.acquisition ? (
          <time dateTime={props.acquisition.toISOString()}>
            {formatYearMonth(props.acquisition)}
          </time>
        ) : (
          <em className="present">present</em>
        )}
      </span>
      <span>
        <span>Advisor:</span>
        <span>
          <a href={props.advisor.href}>
            {props.advisor.position} {props.advisor.name}
          </a>
        </span>
      </span>
      <span>
        <span>Topic:</span>
        <span>{props.topic}</span>
      </span>
    </div>
  );
}
