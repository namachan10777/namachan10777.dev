export const SITE_NAME = "namachan10777.dev";
export const SITE_DESCRIPTION = "namachan10777's personal website and blog";
export const AUTHOR_NAME = "Masaki Nakano";
export const AUTHOR_HANDLE = "namachan10777";

export const AUTHOR_PROFILES = [
  "https://github.com/namachan10777",
  "https://x.com/namachan10777",
  "https://www.linkedin.com/in/masaki-nakano-667493163/",
];

type JsonLdPrimitive = string | number | boolean | null;
type JsonLdValue = JsonLdPrimitive | JsonLdObject | JsonLdValue[];
type JsonLdObject = { [key: string]: JsonLdValue };

export interface JsonLdDescriptor {
  "script:ld+json": JsonLdObject;
}

export interface BlogPostingStructuredDataInput {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  imageKey?: string;
}

function siteUrl(origin: string) {
  return new URL("/", origin).href;
}

function websiteId(origin: string) {
  return `${siteUrl(origin)}#website`;
}

function personId(origin: string) {
  return `${siteUrl(origin)}#person`;
}

export function buildProfilePageStructuredData(
  origin: string,
  profileImage: string,
): JsonLdDescriptor {
  const url = siteUrl(origin);
  const authorId = personId(origin);

  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": websiteId(origin),
          url,
          name: SITE_NAME,
          description: SITE_DESCRIPTION,
          inLanguage: ["en", "ja"],
          publisher: { "@id": authorId },
        },
        {
          "@type": "ProfilePage",
          "@id": `${url}#profile`,
          url,
          isPartOf: { "@id": websiteId(origin) },
          mainEntity: {
            "@type": "Person",
            "@id": authorId,
            name: AUTHOR_NAME,
            alternateName: AUTHOR_HANDLE,
            url,
            image: new URL(profileImage, url).href,
            sameAs: AUTHOR_PROFILES,
          },
        },
      ],
    },
  };
}

export function buildBlogPostingStructuredData(
  origin: string,
  post: BlogPostingStructuredDataInput,
): JsonLdDescriptor {
  const homepage = siteUrl(origin);
  const url = new URL(`/post/${post.id}`, homepage).href;
  const article: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.description,
    dateCreated: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    inLanguage: "ja",
    author: {
      "@type": "Person",
      "@id": personId(origin),
      name: AUTHOR_NAME,
      url: homepage,
    },
    isPartOf: {
      "@type": "WebSite",
      "@id": websiteId(origin),
      name: SITE_NAME,
      url: homepage,
    },
    keywords: post.tags,
  };

  if (post.imageKey) {
    const image = new URL(`/${post.imageKey}`, homepage);
    image.searchParams.set("width", "1200");
    image.searchParams.set("format", "webp");
    article.image = image.href;
  }

  return { "script:ld+json": article };
}
