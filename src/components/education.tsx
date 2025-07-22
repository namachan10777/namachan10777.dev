import { component$ } from "@builder.io/qwik";
import styles from "./education.module.css";

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

export const Education = component$((props: EducationProps) => {
  return (
    <div class={styles.entry}>
      <span>
        <strong>{props.degree}</strong>,
        <a href={props.school.href}>{props.school.name}</a>,
        <time dateTime={props.start.toISOString()}>
          {props.start.getUTCFullYear()}/{props.start.getMonth() + 1}
        </time>
        -
        {props.acquisition ? (
          <time dateTime={props.acquisition.toISOString()}>
            {props.acquisition.getUTCFullYear()}/
            {props.acquisition.getMonth() + 1}
          </time>
        ) : (
          <em class="present">present</em>
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
});
