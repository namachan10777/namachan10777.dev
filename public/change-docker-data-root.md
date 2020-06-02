:date unknown
::

# Dockerイメージの格納先を変更する

夏ですね。響け！ユーフォニアムの事を考えて熱波をやり過ごしていますが人間限界があります。
Dockerに/varを圧縮され気がついたらもう200 MiBしか残っていない、そんな経験はありませんか。
僕は/varを/とは別で切ってraiserfs載せているので頻繁に起きます。
`docker.service`を触って格納先を`/`以下の`/opt/docker`に変更する方法がありますが、
これではパッケージマネージャが`docker.service`を更新する度にリセットされてしまいます。

## 解決策
```bash
systemctl stop docker.service
mkdir -p /opt/docker/
rm -R /var/lib/docker/
mkdir /etc/systemd/system/docker.service.d/
touch /etc/systemd/system/docker.service.d/override.conf
```
内容を移し替え、ファイルを作成し、次のように編集します。これでイメージとか全部消えるので注意。
```
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd --data-root /opt/docker
```

上記のように書き換えたあと、下のコマンドで更新すれば終わりです。
```
systemd daemon-reload
```
`ExecStart=`が無いと
`docker.service: Service has more than one ExecStart= setting, which is only allowed for Type=oneshot services. Refusing.`
と言われます。
systemdにはドロップインファイルと呼ばれるユーザーが独自にserviceの一部を書き換えるための機能が提供されており、
これはパッケージ管理システムの外にあるので恒久的な変更が可能です。
`systemctl editP`を使ってもいいです。今まで知らなかった。
けしずみ(\@ray45422)さんに教えていただきました。ありがとうございます。
