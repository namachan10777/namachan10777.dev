import { LinkCard } from "~/components/link-card";
import * as rudis from "~/generated/rudis";

interface LinkCardKeepProps {
  keep: rudis.LinkCardKeep;
}

export function LinkCardKeep(props: LinkCardKeepProps) {
  const { keep } = props;
  return (
    <LinkCard
      href={keep.href}
      title={keep.title}
      description={keep.description}
      favicon={keep.favicon ?? null}
    />
  );
}
