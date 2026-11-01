# 運用記録

## 第1章 GitHub・Firebaseへの移行

|番号|操作|状態|
|---|---|---|
|1.1.1|専用GoogleサービスアカウントとGitHub短期認証の設定|完了|
|1.1.2|GitHub Actionsの2変数登録|完了|
|1.1.3|Firestoreインデックス2件と初回公開|完了|

対象：新宿御苑 桜開花推定。移行版：v4.0.0。設定日：2026-11-01。

- GitHub：`ugetsuren/shinjuku-sakura-timing`（public）、数値ID `1441897234`。
- Firebase：`shinjukugyoensimulate`、番号 `1045334579409`、Sparkプラン。
- 公開URL： https://shinjukugyoensimulate.web.app/
- Firestore：Standard、`(default)`、`asia-northeast1`。既存の匿名記録2件を継承。
- 認証：`github-sakura/providers/github`、`sakura-hosting-deploy`。
- 権限：Hosting Admin、Service Usage Consumer、対象リポジトリmainに限定したWorkload Identity User。
- Googleの長期JSON秘密鍵は発行していません。

## 確認結果

- ローカルとGitHub CIで6テスト、TypeScript型チェック、本番ビルドが成功。
- 64通りの入力端値組み合わせで有限な日付と推定区間の順序を確認。
- 表紙→説明→6条件→推定結果→匿名集計のブラウザー操作を確認。
- 既存Firestoreのcount/averageと最小・最大の日付を読み取り確認。
- 確認用の架空データを本番へ書き込んでいません。共有の書き込み操作は今回の受入検証では未実行です。
- 初回公開成功： https://github.com/ugetsuren/shinjuku-sakura-timing/actions/runs/41318554385
- 公開コミットと全配信ファイルのSHA-256照合が成功。

## 元の成果物との対応

Sites版v3のソースコミット `6793312208168f22ae0cb8cec39f14b2e1eedfc7` を取得して移行しました。
推定モデル・質問文・参考文献は変更していません。
実行基盤をVite/React＋既存Firestoreへ変更し、使わなくなったCloudflare/Next.jsのひな形を除去しました。
元のSites公開は変更していません。以後のソース管理と公開更新はGitHub→Firebaseを使用します。
