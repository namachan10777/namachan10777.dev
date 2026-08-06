import { describe, expect, it } from "vitest";
import {
  AUTHOR_PROFILES,
  buildBlogPostingStructuredData,
  buildProfilePageStructuredData,
} from "./structured-data";

describe("profile page structured data", () => {
  it("describes the site and its author with stable absolute identifiers", () => {
    const descriptor = buildProfilePageStructuredData(
      "https://example.com",
      "/assets/icon.webp",
    );

    expect(descriptor["script:ld+json"]).toEqual({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": "https://example.com/#website",
          url: "https://example.com/",
          name: "namachan10777.dev",
          description: "namachan10777's personal website and blog",
          inLanguage: ["en", "ja"],
          publisher: { "@id": "https://example.com/#person" },
        },
        {
          "@type": "ProfilePage",
          "@id": "https://example.com/#profile",
          url: "https://example.com/",
          isPartOf: { "@id": "https://example.com/#website" },
          mainEntity: {
            "@type": "Person",
            "@id": "https://example.com/#person",
            name: "Masaki Nakano",
            alternateName: "namachan10777",
            url: "https://example.com/",
            image: "https://example.com/assets/icon.webp",
            sameAs: AUTHOR_PROFILES,
          },
        },
      ],
    });
  });
});

describe("blog posting structured data", () => {
  const post = {
    id: "2026/test",
    title: "Test post",
    description: "Test description",
    createdAt: new Date("2026-07-22T00:00:00.000Z"),
    updatedAt: new Date("2026-07-23T12:34:56.000Z"),
    tags: ["tech", "rust"],
  };

  it("describes an article using D1 creation and modification timestamps", () => {
    const descriptor = buildBlogPostingStructuredData(
      "https://example.com",
      post,
    );

    expect(descriptor["script:ld+json"]).toEqual({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": "https://example.com/post/2026/test#article",
      url: "https://example.com/post/2026/test",
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": "https://example.com/post/2026/test",
      },
      headline: "Test post",
      description: "Test description",
      dateCreated: "2026-07-22T00:00:00.000Z",
      dateModified: "2026-07-23T12:34:56.000Z",
      inLanguage: "ja",
      author: {
        "@type": "Person",
        "@id": "https://example.com/#person",
        name: "Masaki Nakano",
        url: "https://example.com/",
      },
      isPartOf: {
        "@type": "WebSite",
        "@id": "https://example.com/#website",
        name: "namachan10777.dev",
        url: "https://example.com/",
      },
      keywords: ["tech", "rust"],
    });
    expect(descriptor["script:ld+json"]).not.toHaveProperty("datePublished");
    expect(descriptor["script:ld+json"]).not.toHaveProperty("image");
  });

  it("uses the transformed Open Graph image when one is available", () => {
    const descriptor = buildBlogPostingStructuredData("https://example.com", {
      ...post,
      imageKey: "image/og/test.png",
    });

    expect(descriptor["script:ld+json"]).toHaveProperty(
      "image",
      "https://example.com/image/og/test.png?width=1200&format=webp",
    );
  });
});
