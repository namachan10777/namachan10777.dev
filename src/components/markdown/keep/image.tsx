import { component$ } from "@builder.io/qwik";
import * as rudis from "~/generated/rudis";

interface ImageKeepProps {
  keep: rudis.ImageKeep<rudis.R2StoragePointer>;
}

export const ImageKeep = component$((props: ImageKeepProps) => {
  const { keep } = props;
  const srcset = [
    `/${keep.storage.key}?format=webp&width=300 400w`,
    `/${keep.storage.key}?format=webp&width=500 600w`,
    `/${keep.storage.key}?format=webp&width=800 1200w`,
    `/${keep.storage.key}?format=webp&width=1000 2000w`,
  ].join(",");
  return (
    <img
      src={`/${keep.storage.key}?width=100&format=webp`}
      srcset={srcset}
      alt={keep.alt}
      width={keep.width}
      height={keep.height}
      loading="lazy"
      decoding="async"
    />
  );
});
