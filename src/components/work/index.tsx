import { formatYearMonth } from "~/lib/format";
import * as shared from "~/styles/shared.css";

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
    <div className={shared.timelineEntry}>
      <span className={shared.timelinePeriod}>
        <time dateTime={props.start.toISOString()}>
          {formatYearMonth(props.start)}
        </time>
        {" — "}
        {props.retire ? (
          <time dateTime={props.retire.toISOString()}>
            {formatYearMonth(props.retire)}
          </time>
        ) : (
          <em>present</em>
        )}
      </span>
      <div className={shared.timelineBody}>
        <strong className={shared.timelineTitle}>{props.position}</strong>
        <a href={props.company.href}>{props.company.name}</a>
        <dl className={shared.timelineMeta}>
          <dt className={shared.timelineMetaKey}>Topic</dt>
          <dd className={shared.timelineMetaValue}>{props.topic}</dd>
        </dl>
      </div>
    </div>
  );
}
