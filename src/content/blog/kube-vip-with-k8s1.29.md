---
name: "kube-vip-with-k8s1.29"
category: ["tech"]
date: 2024-02-21
description: kube-vipをKubernetes 1.29で使う上での問題点と回避策
title: kube-vipをKubernetes 1.29で使う
---

k8sはコントロールプレーンからワーカーのPodまで高可用性構成（以下HA構成）に出来るが、
keepalivedとHAProxyで行うような単一のIPをHA構成でアクセス出来るようにする方法は標準では提供されない。
GKE、EKSなどのクラウドプロバイダの提供するマネージドk8sではAWS ALBなどのクラウドサービスプロバイダ側のサービスにより
このような機能が提供されるが、完全にベアメタルの環境では自力でリバースプロキシないしVIPを使用する必要がある。
リバースプロキシサーバの冗長化まで行う場合はkeepalivedとHAProxyを使うのが鉄板の構成だが、
k8s管理外でかつ可用性を考慮したコンポーネントを用意するのは若干面倒である。

DaemonSetでkeepalivedとHAProxyをデプロイするのも一つの手だが、
今はより楽な方法がある。[`kube-vip`](https://kube-vip.io)だ。

kube-vipはARPまたはBGP routingを用いてkeepalived + HAProxyを代替可能で、かつデプロイも簡単である。
k8sのAPIと連携して動くので設定も特に不要だ。

ところで、k8s v1.28まではStatic Pod（k8sのAPIサーバやetcdと同様の方法）でデプロイするのが最も楽な方法だった。
単純にコントロールプレーンの全てのノードでデプロイするだけで事足りる。
ところが`kubeadm`を用いてクラスタを構築する場合、k8s 1.29以降はこのStatic Podのデプロイが困難となった。
k8s 1.29以降の`kubeadm`からは`/etc/kubernetes/admin.conf`の構築中の権限が下げられているため
k8sのcoordination APIに触れずPodが立ち上がらない。
`ClusterRole`と`ClusterRoleBinding`を書いて権限を割り当てようにも`/etc/kubernetes/manifests`にはPodしか書けない。

[kube-vipのIssue](https://github.com/kube-vip/kube-vip/issues/684#issuecomment-1864855405)ではad-hocな解決策が提案されている。
`mountPath`を書き換えて`super-admin.conf`を代わりに使い、`kubeadm init`の後に戻せば良い。

別の方法もある。ipではなくドメイン名でコントロールプレーンを指定し、`/etc/hosts`で解決する。
最初のcontrolplaneを立ち上げる際には`127.0.0.1`に向けて普通に起動する。
その状態で`DaemonSet`を使って`kube-vip`をデプロイし、`/etc/hosts`でVIPに向くようにすれば解決する。
この方法はPodの作り直しも起こらず差し替えがやりやすく、今後も安定して使えると思う。

何にせよ最新のkubeadmを使った構築ではkube-vipはそのまま動かない。多分kubesprayとかも同様だ。
kube-vip側の変更で対応することも可能だろうが、この問題はkube-vipの問題というよりデプロイの問題だ。
個人的には`DaemonSet`でデプロイするのが一番良いように思う。
