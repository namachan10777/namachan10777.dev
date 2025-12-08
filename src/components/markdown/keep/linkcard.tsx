import { component$ } from "@builder.io/qwik";
import { LinkCard } from "~/components/link-card";
import * as rudis from "~/generated/rudis";

interface LinkCardKeepProps {
  keep: rudis.LinkCardKeep;
}

export const LinkCardKeep = component$((props: LinkCardKeepProps) => {
  const { keep } = props;
  return (
    <LinkCard
      href={keep.href}
      title={keep.title}
      description={keep.description}
      favicon={keep.favicon ?? null}
    />
  );
});
