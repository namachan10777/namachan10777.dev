import * as rudis from "~/generated/rudis";

export const ImageKeep = ({
  keep,
}: {
  keep: rudis.ImageKeep<rudis.R2StoragePointer>;
}) => {
  const srcset = [
    `/${keep.storage.key}?format=webp&width=300 400w`,
    `/${keep.storage.key}?format=webp&width=500 600`,
    `/${keep.storage.key}?format=webp&width=800 1200w`,
    `/${keep.storage.key}?format=webp&width=1000 2000`,
  ].join(",");
  return (
    <img
      src={`/${keep.storage.key}width=100&format=webp`}
      srcset={srcset}
      alt={keep.alt}
      width={keep.width}
      height={keep.height}
      loading="lazy"
      decoding="async"
    />
  );
};
