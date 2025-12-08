import { component$ } from "@builder.io/qwik";
import * as rudis from "~/generated/rudis";

interface ImageKeepProps {
  keep: rudis.ImageKeep<rudis.R2StoragePointer>;
}

export const ImageKeep = component$((props: ImageKeepProps) => {
  const { keep } = props;
  const srcset = [
    `/${keep.storage.key}?format=webp&width=400 400w`,
    `/${keep.storage.key}?format=webp&width=800 800w`,
    `/${keep.storage.key}?format=webp&width=1200 1200w`,
    `/${keep.storage.key}?format=webp&width=1600 1600w`,
  ].join(",");
  return (
    <img
      src={`/${keep.storage.key}?width=800&format=webp`}
      srcset={srcset}
      sizes="(max-width: 52rem) calc(100vw - 3rem), 49rem"
      alt={keep.alt}
      width={keep.width}
      height={keep.height}
      loading="lazy"
      decoding="async"
    />
  );
});
