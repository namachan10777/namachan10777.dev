import * as rudis from "~/generated/rudis";

interface FootnoteKeepProps {
  keep: rudis.FootnoteReferenceKeep;
}

export function FootnoteKeep(props: FootnoteKeepProps) {
  const { keep } = props;
  return (
    <sup>
      <a id={`footnote-reference-${keep.id}`} href={`#footnote-${keep.id}`}>
        [{keep.reference ? keep.reference : "?"}]
      </a>
    </sup>
  );
}
