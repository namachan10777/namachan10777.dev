import { component$ } from "@builder.io/qwik";
import styles from "./styles.module.css";

export type Author = string | { me: string };

export interface BookProps {
  authors: Author[];
  translators?: Author[];
  title: string;
  publisher: string;
  comment?: string;
  year: number;
}

export interface WorkshopProps {
  authors: Author[];
  title: string;
  workshop: string;
  year: number;
}

const Authors = component$((props: { authors: Author[] }) => {
  return (
    <ol class={styles.authors}>
      {props.authors.map((a) =>
        typeof a === "string" ? (
          <li key={a}>{a}</li>
        ) : (
          <li key={a.me}>
            <strong>{a.me}</strong>
          </li>
        ),
      )}
    </ol>
  );
});

export const Book = component$((props: BookProps) => {
  return (
    <div>
      {props.comment ? <strong>({props.comment})</strong> : null}
      {props.translators ? (
        <>
          <span>
            Author: <Authors authors={props.authors} />
          </span>
          <span>
            Translator: <Authors authors={props.translators} />
          </span>
        </>
      ) : (
        <Authors authors={props.authors} />
      )}
      <span>"{props.title},"</span>
      <span>{props.publisher},</span>
      <time dateTime={props.year.toString()}>{props.year}</time>
    </div>
  );
});

export const Workshop = component$((props: WorkshopProps) => {
  return (
    <div>
      <Authors authors={props.authors} />
      <span>"{props.title},"</span>
      <span>{props.workshop},</span>
      <time dateTime={props.year.toString()}>{props.year}</time>
    </div>
  );
});
