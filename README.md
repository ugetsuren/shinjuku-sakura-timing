# 新宿御苑 桜開花推定 v4

新宿御苑のソメイヨシノ開花時期を、6つの環境条件と4つの近似モデルから試算する学習用シミュレーターです。
科学的な係数・参考文献・入力ガイド・桜色の画面は既存Sites版v3から引き継いでいます。

- 公開ソース： https://github.com/ugetsuren/shinjuku-sakura-timing
- 既存公開先： https://shinjukugyoensimulate.web.app/
- 元のSites版： https://shinjuku-sakura-timing.ugetsueren.chatgpt.site/

## 構成

GitHub main → GitHub Actions（テスト・型チェック・ビルド）→ Firebase Hosting。
画面はReactとViteでビルドします。匿名の推定結果はブラウザーから既存Firestoreへ接続します。
Firebaseは既存Sparkプラン、データベースは東京のStandard版 `(default)` を使用します。
サーバー常時起動やCloud Functionsは不要です。

結果を共有する操作だけがFirestoreへ書き込みます。氏名・連絡先・端末識別情報はアプリの記録へ保存しません。
集計はcount/averageと必要な最小・最大の記録だけを取得し、全件ダウンロードを避けます。
既存Firestoreのフィールド名と既存データを継承します。匿名データは誰でも閲覧可能で、所定の範囲に収まる新規投稿のみ許可し、更新・削除は拒否します。
匿名投稿である以上、同一人物による別の操作からの連続投稿を完全には防げません。

## 開発・確認

Node.js 24以上。

```bash
npm ci --ignore-scripts
npm test
npm run build
npm run dev
```

`npm run dev` の既定URLは `http://127.0.0.1:5173` です。
ローカル実行でも共有ボタンは本番Firestoreへ接続するため、確認用の架空データは送信しないでください。
テストでは本番データへ書き込みません。

## 文章の変更

- `app/data/editableText.ts`：表紙・導入・データ収集説明・小話
- `app/data/questions.ts`：質問・入力ガイド・選択肢・参考文献
- `app/lib/model.ts`：既存の推定式（今回の移行では変更なし）
- `app/lib/community.ts`：Firestoreへの接続

## GitHubからの公開

初回のGoogle認証・短期認証設定は [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) を参照してください。
設定がない状態のワークフローは公開成功になりません。
公開後は `/release.json` と配信ファイルのSHA-256を照合します。
通常の更新はHostingのみを配信し、データベースやルールを変更しません。

Firebase Web設定は公開用識別子です。サービスアカウントのJSON秘密鍵やOAuthトークンはリポジトリに入れません。
写真の著作権表示とCC BY 3.0へのリンクは画面に引き継いでいます。公開ソース全体への一括した再利用ライセンスは設定していません。
