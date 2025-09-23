import { IsolatedLink } from "~/components/link-card";
import * as rudis from "~/generated/rudis";

export const LinkCardKeep = ({ keep }: { keep: rudis.LinkCardKeep }) => {
  return (
    <IsolatedLink
      href={keep.href}
      title={keep.title}
      description={keep.description}
      favicon={keep.favicon ? keep.favicon : null}
      image={keep.og_image ? keep.og_image : null}
    />
  );
};
