---
name: "blog-on-rust"
category: ["tech"]
date: 2023-05-22
description: Next.jsから自作のRust製静的サイトジェネレータへ移行した
title: 個人サイトをRustで書き直した
publish: true
---

[NextJSで書いていたもの](./blog-on-nextjs.html)を結局Rustで書き直した。この時は普通に`getStaticPaths`, `getStaticProps`内で`fs`モジュールを使えばいいところを、何故かWebpackでMarkdownを読み込んでいたがこれが無くてもNextJS（というよりはVercel)でのビルドには問題があった。Vercelの
ビルド環境ではGitの履歴が上手く取得出来ないため事前にメタデータをスクリプトで生成する必要があった。Vercelで完結しない以上もうGHAとかでビルドしても良い気がした。

またmdastからReactでHTMLを生成するのもあまり筋が良くない。mdastはただのastなのでReactのkeyに相当するものはない。適当にsha256を取ってお茶を濁していたが、keyとして全く機能していなかった。どうせ全部静的に生成するのでkeyとして機能しなくても問題はないのだが、ちょっと気持ち悪い。

またそもそも短い静的なコンテンツなのだから生HTMLでも十分早いだろうしわざわざNextJSを使うこともないだろう、とRustでの静的生成に変更した。

ただ切り替えたサイトにアクセスしてみるとかなり遅くなってしまっていたので後でちょっと手を加える必要があるかもしれない。

## シンタックスハイライト

最初は[syntect](https://github.com/trishume/syntect)を使っていたが、途中で変えて[tree-sitter](https://tree-sitter.github.io/tree-sitter/)でのハイライトを行う`tree-sitter-highlight`クレートを使った。ただこのクレートはsyntectのように行単位でのハイライトは行わず、ネストしたネストした構造を作るのでCSSを使った行番号の表示はちょっと難しい。
後で実装するつもりでいる。

## デプロイ

Cloudflare pagesを使った。出た頃はGitでのデプロイしか出来ず使いづらかったが今はAPI経由でアップロードが可能で、[`wrangler`](https://developers.cloudflare.com/workers/wrangler/)を使えば簡単に出来る。
ちょっとデプロイに時間がかかるのが難点だが簡単にデプロイ出来て嬉しい。

## TODO

- Gitによる履歴
- 画像最適化
- ページ遷移最適化
- コードスニペットのコピーボタン
