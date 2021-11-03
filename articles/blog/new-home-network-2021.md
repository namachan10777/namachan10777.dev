---
title: 新居のネットワーク
category: ["tech"]
name: "new-home-network-2021"
---

1年住んでいた筑波大学の宿舎からアパートに引っ越すことにした。
宿舎のネットワークは各部屋にルータとAPが設置されており、
入居者は勝手にルータとAPを設置することが出来ない（一部許可されてはいるものかなり限定的なのであまり意味がない）
そのためQNAPのQSW-M408Sのみを使っていたが、
新居では当然回線事業者とプロバイダから自力で設定する必要があるので
APとルータを新規で調達した。

APは[FS](https://fs.com)の[AP-W6D2400C](https://www.fs.com/jp/products/108705.html)を直販で買ってルータはNECの[IX2215](https://jpn.nec.com/univerge/ix/Info/ix2215.html)をヤフオクで買った。
[AP-W6D2400C](https://www.fs.com/jp/products/108705.html)はWiFi6(802.11ax)対応で32個のSSIDを設定出来る。
SSID毎にVLANを設定出来るので上流側のルータで設定すればゲスト用のSSIDと自分用のSSIDでVLAN分離する事も出来る。
FS以外にもWiFi6対応のルータを販売しているのはUbiquitiなど複数あるが、FS以外だと在庫不足で調達出来ない事も多い上FSはコスパが良い。

IX2215は特別高性能という訳ではないがMap-EもDS-Liteも使え、IPSecでも1.3 Gbps出るので性能としては十分。
