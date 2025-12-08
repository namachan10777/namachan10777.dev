# namachan10777.dev

個人サイト [namachan10777.dev](https://www.namachan10777.dev) のソースコード。

## 技術スタック

- **フレームワーク**: [Qwik](https://qwik.dev/) + [QwikCity](https://qwik.dev/qwikcity/overview/)
- **ホスティング**: Cloudflare Pages
- **CMS**: [rudis-cms](https://github.com/namachan10777/rudis-cms) (自作)
- **画像配信**: Cloudflare Images

## 開発

```shell
bun install
bun dev
```

## ビルド

```shell
bun build
```

## デプロイ

masterブランチへのpushで自動デプロイされる。

コンテンツの更新は `rudis-cms` によって処理され、GitHub Actionsで自動的にCloudflare D1/R2/KVに反映される。
