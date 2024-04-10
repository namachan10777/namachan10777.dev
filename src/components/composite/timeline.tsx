import { component$ } from "@builder.io/qwik";

export type Event = {
  title: string;
  href?: string;
  date: string;
};

export type Props = {
  events: Event[];
};
const CenterMark = () => {
  return (
    <div class="relative flex h-full flex-col items-center justify-center">
      <div class="h-full w-px bg-gray-600"></div>
      <div class="absolute top-[calc(50%_-_0.25rem)] h-[0.5rem] w-[0.5rem] rounded-full border border-black bg-white"></div>
    </div>
  );
};

export default component$((props: Props) => {
  return (
    <ol class="grid grid-cols-[4rem_2rem_1fr] items-center">
      {props.events.map((event) => (
        <li key={event.date.toString()} class="contents">
          <div>
            <span class="font-mono text-sm text-gray-600">{event.date}</span>
          </div>
          <CenterMark />
          <span class="py-2">
            {event.href ? (
              <a class="underline" href={event.href}>
                {event.title}
              </a>
            ) : (
              event.title
            )}
          </span>
        </li>
      ))}
    </ol>
  );
});
