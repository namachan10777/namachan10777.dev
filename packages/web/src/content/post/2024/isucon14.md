---
tags: ["tech"]
date: 2024-12-19
description: インターン先のArkEdge Spaceの社員と一緒にISUCON14に参加してきた
title: ISUCIN14出てきました
publish: true
---

---

[sksat](https://github.com/sksat)、[sankichi92](https://github.com/sankichi92)と一緒にISUCON14に出た。
去年は再起動試験で失格になったが、今年は100位に付けられた。来年は30位に入りたいですね。

## やったこと

ずっとSSEをやっていた。`INSERT`だけではなく`UPDATE`も通知しないといけないのを忘れて無限にバグらせたのは反省。
Rustだとtokioの`tokio::sync::watch`で簡単にアプリケーションサーバ内での通知バスを作れるので便利。
実務だとKafkaなりAWS SQS、AWS SNSを使う実装にするのがスタンダードなのだろう。

マッチングアルゴリズムの改善等他のエンドポイントの改善に手を入れられなかったのは反省。来年は筋力を高めて複数のボトルネックを直せるようにしたい。

あとはデプロイ周りを去年の[itamae](https://github.com/itamae-kitchen/itamae)から[Ansible](https://docs.ansible.com/)に変えた。
理由としては自分が慣れているからと、複数ノードの自動プロビジョニングがやりやすいから。
個人的にはこれは正解だったと思う。普段Rustの次にAnsible yamlとTerraformを書いているので楽だったし、デプロイが簡単になった。

## 感想

点数自体はsankichi92さんのインデックス改善と自分のSSEで上がった感があるが、
多分SSEに関してはこれ単体で上がったのではなく他メンバーの入れた改善がSSEで入ったのが大きいと思う。
去年はアプリケーション改善は自分だけでやっていたのに対して、今年は三人全員がRust Webサーバーを書けるようになっていたので
改善が効きやすかったんだろうと思う。

また来年も出るぞ〜
