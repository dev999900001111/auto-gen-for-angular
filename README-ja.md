# auto-gen-for-angular

ChatGPTのAPIを使ってAngularの画面を生成するプログラムです。

主に業務システムを作る用途を想定しています。だいたい20〜30程度のコンポーネントを自動生成できます。

AutoGPTのような自立型のエージェントではなく、事前に決められたタスクを実行するだけのタスクランナーです。

エラー訂正機能はつけてない（コスト爆発怖い）ので、あくまでサンプルプログラムを一括生成してくれるだけで、生成物がそのまま使えるレベルではありません。


## 動かし方
OpenAIのAPIが使える環境であることが前提です。

ソースと同じ階層に「000-requirements.md」というファイル名で作りたいシステムのユーザーシナリオを書いてから動かすとAngularの画面セットが出来上がってきます。
動かし方は generator.js を実行するだけです。

```bash
# ライブラリをインストール
npm install
# 実行
ts-node src/main.ts
```


## コスト
サンプルの000-requirements.mdで作ったものでだいたい30万トークン≒約50円くらいでした。

ソース生成系を全部GPT-4にすると大体700円くらいかかります。


## 使い方 
generator.jsの下の方にあるこの辺↓のところがステップを実行しているところで、

initPromptでプロンプトを作成して、runで実行です。

```javascript
  obj = new Step000_RequirementsToComponentList();
  obj.initPrompt();
  await obj.run();
```

一気通貫でも大体動きますが、動かしたいステップ以外はコメントアウトして使うことが多いです。
特にSTEP12以降はものによっては大量実行になるので、一旦initPromptでプロンプトの出来栄えを見て、いくつかPlaygroundで実行してみて結果が良さそうだったらrunを動かす、みたいな使い方をしています。

## 何ができるか
この記事に簡単にまとめてあります。
> https://qiita.com/Programmer-cbl/items/7980e9c3085a8ce2aaf9

人手で修正を加えると以下のようなものになります。だいたい３時間くらい手間がかかっています。
> https://bank-crm-v1-mock.s3.ap-northeast-1.amazonaws.com/index.html
