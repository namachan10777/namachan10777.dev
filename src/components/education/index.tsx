import { formatYearMonth } from "~/lib/format";
import * as shared from "~/styles/shared.css";

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
    <div className={shared.timelineEntry}>
      <span className={shared.timelinePeriod}>
        <time dateTime={props.start.toISOString()}>
          {formatYearMonth(props.start)}
        </time>
        {" — "}
        {props.acquisition ? (
          <time dateTime={props.acquisition.toISOString()}>
            {formatYearMonth(props.acquisition)}
          </time>
        ) : (
          <em className="present">present</em>
        )}
      </span>
      <div className={shared.timelineBody}>
        <strong className={shared.timelineTitle}>{props.degree}</strong>
        <a href={props.school.href}>{props.school.name}</a>
        <dl className={shared.timelineMeta}>
          <dt className={shared.timelineMetaKey}>Advisor</dt>
          <dd className={shared.timelineMetaValue}>
            <a href={props.advisor.href}>
              {props.advisor.position} {props.advisor.name}
            </a>
          </dd>
          <dt className={shared.timelineMetaKey}>Topic</dt>
          <dd className={shared.timelineMetaValue}>{props.topic}</dd>
        </dl>
      </div>
    </div>
  );
}
