import { LinkCard } from "~/components/link-card";
import * as rudis from "~/generated/rudis";

export const LinkCardKeep = ({ keep }: { keep: rudis.LinkCardKeep }) => {
  return (
    <LinkCard
      href={keep.href}
      title={keep.title}
      description={keep.description}
      favicon={keep.favicon ?? null}
    />
  );
};
