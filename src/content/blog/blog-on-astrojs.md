---
name: "blog-on-astrojs"
category: ["tech"]
date: 2024-02-22
description: 個人サイトをAstroJSで作り直した
title: 個人サイトをAstroJSで書き直した
---

またやった。
自前で全部やるのは辛いけどNext.jsではコンテンツ管理が面倒……。
と思っていたが、研究室のWebページ ( https://www.hpcs.cs.tsukuba.ac.jp )をAstroでリプレースした際思いの外コンテンツ管理が快適だったので乗り換えた。

コンテンツ本体の管理は組み込みの`astro:content`を使っている。
少なくとも情報工学の学生が個人でブログを書くには十分だ。上述の研究室のサイトは2000以上の論文ページをレンダリングしているが十分扱えている。
mdxも使えるので変なコンポーネントを挿入したくなった時も対応出来る。

## CSS

Astroは[データ属性](https://developer.mozilla.org/ja/docs/Learn/HTML/Howto/Use_data_attributes)とセレクタを組み合わせることで
ひとつの`.astro`ファイル内にCSSの適用領域を限定している
これは簡潔でエレガントな手法で、BEMに則ってやたらと長いクラス名をつけるだとか、utility-firstなCSSフレームワークで
`:hover`の扱いに苦労するだとかをしなくて良い。
他のコンポーネントに対してCSSを当てることは出来ないが、コンポーネントとはそもそもそういうものので大半の場合でうまく機能する。

ただしMarkdownだけはこの仕組みに乗っかることは難しいので`global.css`でスタイルを書いている。

デザインは`reset.css`を適用してから自分で手で書いた。
見るに堪えない状況を回避するだけであまり面白味はないが、
私がキャリア上FigmaとAdobe XDを使いこなすことを求められる日は来ないだろうし問題ないだろう。
デザイナーのポートフォリオだってパフォーマンスという点で見れば満点とならないものは少なくない。

CSS変数を定義して`0.5 rem`単位で調整してある程度一貫性を持たせるように努めたがすでに破綻しつつある。
コンポーネント単位で影響範囲が区切られていなければ即死だったかもしれない。

## Markdownのレンダリング

[`reamrk-sectionize`](https://www.npmjs.com/package/remark-sectionize)だけ導入した。
Markdownは意味論上見出しタグも本文もフラットにレンダリングする。
現在のWebブラウザや検索エンジンはフラットに並んだDOMを適切に解釈する（と思われる）ので別にそこまで気に留めることはないのだが、
Web標準に`<section />`タグがあるので対応した。
Astroはmarkdown処理にremarkプラグインを簡単に入れられるので`astro.config.js`を弄るだけで済む。

```typescript
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import remarkSectionize from "remark-sectionize";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://www.namachan10777.dev",
  integrations: [icon(), react(), sitemap()],
  markdown: {
    remarkPlugins: [remarkSectionize],
  },
});
```

[ブログページ](/blog/)のプレビューテキストはreamrkでHTML化した文字列を`jsdom`でパースして`.window.document.body.textContet`を取得する力技で実装した。これより効率的な実装はあり得るが、どうせビルド時に行われることなので多分この実装が最適。

## OG画像

[`satori`](https://github.com/vercel/satori)とReactで生成した画像を`sharp`でWebPに変換している。
Astroはhtml以外の静的ファイルもGETエンドポイントの形で記述し、`getStaticPaths`をexportすればファイルをビルド時に生成出来るので便利だ。
生成に使うReactは`package.json`には含まれるが、ページに出力されるコンポーネントのロジックは全てVanilla JS（TS）で書いているので
ブラウザがReactランタイムをダウンロードすることはない。

エンドポイントのコードは下記のようになる。
`ogImage`は`satori`を使ってOG画像を生成する関数だ。
`satori`にReactのJSXとフォントデータを与えればSVGが文字列として出てくるので`sharp(Buffer.from(svg)).webp().toBuffer()`とするだけ。

```typescript
export const GET: APIRoute = async ({ params }) => {
  const article = await getEntryBySlug("blog", params.slug as any);

  const title = article?.data.title;
  const description = article?.data.description;
  const body = await ogImage({
    title: title || "No title",
    titleFontSize: 4,
    description,
    url: `https://namachan10777.dev/blog/${params.slug}`,
    width,
    height,
  });
  return new Response(body);
};
```

## RSS

`@astrojs/rss`を使った。
`astro:content`のAPIでfrontmatterを取ってきてGETエンドポイントの形で書くだけ。
特に凝ったことはしていない。

```typescript
import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

const blog = await getCollection("blog");

export const GET: APIRoute = async (ctx) => {
  return rss({
    title: "namachan10777 Blog",
    description: "分散システム、ストレージ、Web、あとそのほか",
    site: ctx.site || "https://www.namachan10777.dev",
    items: blog
      .sort((a, b) => a.data.date.getTime() - b.data.date.getTime())
      .map((blog) => ({
        title: blog.data.title,
        pubDate: blog.data.date,
        description: blog.data.description,
        link: `/blog/${blog.slug}`,
      })),
  });
};
```

## 動的なページ変化

Reactは使っていない。 WebアプリケーションでもないのにReactを使うのはランタイムがデカすぎる。
Svelteやpreactといった選択肢もあったが何となくWebComponentsを使ってVanillaで書いた。
ただこのブログのリプレースをした時点ではFirefoxがdeclarative shadow dom（`<template />`タグでshadow rootを宣言出来る機能）に対応していなかったのでShadow rootは使っていないし、大体SSGフレームワークを使っている以上カスタムタグを使える嬉しさもあまりない。
正直`document.querySelector`するのでも別に良かった。

## 展望

[Pagefind](https://pagefind.app/)を使って検索機能を実装したいが、かなり扱いが難しい。
デフォルトのUIは動作が怪しく（これはPagefindの実装が悪いのではなく、そもそもWebデザインとはそういうものだからだと思う）、
APIを使おうとすると型システムがうまく動かない。

ページネーションも実装したい。記事が少ないうちに考えるようなことではない気がするが。
