import * as rudis from "~/generated/rudis";

export const FootnoteKeep = ({
  keep,
}: {
  keep: rudis.FootnoteReferenceKeep;
}) => {
  return (
    <sup>
      <a id={`footnote-reference-${keep.id}`} href={`#footnote-${keep.id}`}>
        [{keep.reference ? keep.reference : "?"}]
      </a>
    </sup>
  );
};
