# FirebaseとGitHubの初回接続

対象は既存の Firebase `shinjukugyoensimulate`、東京の Standard Firestore `(default)`、公開GitHub `ugetsuren/shinjuku-sakura-timing` です。
無料のSparkプランを維持し、Cloud Functionsや有料プランは使用しません。

## 第1章 → 1.1 Googleの初回認証と自動公開設定【完了】

2026-11-01に専用サービスアカウント・GitHub短期認証・リポジトリ変数・集計用インデックス2件を設定しました。
GitHub ActionsからのHosting公開と全配信ファイルのSHA-256照合が成功しています。
既存の推定結果2件はそのまま参照でき、ルールの公開権限は変更していません。
以下は構成を確認・再現するための手順です。同じ環境での再実行は不要です。

目的：GitHubのmainブランチだけが既存Hostingへ公開できるようにします。
対象アプリ：Google Cloud Shell、GitHub。

### 1.1.1 Google Cloud Shellで設定

Firebaseコンソールで対象プロジェクトを選び、Cloud Shellを開きます。
Google側のプロジェクト管理権限を持つアカウントで、次を実行します。

```bash
git clone https://github.com/ugetsuren/shinjuku-sakura-timing.git
cd shinjuku-sakura-timing
bash scripts/configure-firebase-github.sh
```

このスクリプトは専用サービスアカウントと短期認証の許可を設定します。
長期JSON秘密鍵は作りません。公開権限はHosting AdminとService Usage Consumerのみです。
許可対象は数値リポジトリID `1441897234`、所有者ID `334442186`、mainへのpushまたは手動実行に限定します。
既存の部員アプリや他プロジェクトの権限は変更しません。

### 1.1.2 GitHubに識別子を登録

GitHubの対象リポジトリから Settings → Secrets and variables → Actions → Variables に進みます。
スクリプトが表示する値を以下の2変数に登録します。

|変数|値|
|---|---|
|`GCP_WORKLOAD_IDENTITY_PROVIDER`|スクリプトが表示する `projects/.../providers/github`|
|`FIREBASE_DEPLOY_SERVICE_ACCOUNT`|`sakura-hosting-deploy@shinjukugyoensimulate.iam.gserviceaccount.com`|

どちらも公開可能な識別子です。Googleのパスワードや秘密鍵を入力する欄ではありません。

### 1.1.3 インデックスと初回公開

同じCloud Shellで、既存匿名集計に必要な索引を追加します。記録は削除・上書きしません。

```bash
npx -y firebase-tools@latest deploy --only firestore:indexes --project shinjukugyoensimulate
```

FirebaseコンソールのFirestore → インデックスで2件が有効になったことを確認します。
GitHubのActions → Firebase Hosting → Run workflowでmainを実行します。
完了条件はワークフロー成功に加え、公開 `/release.json` と全配信ファイルのハッシュがコミットと一致することです。
設定がない状態では公開ワークフローは明示的に失敗し、公開成功とは報告しません。

1.1.1〜1.1.3は完了済みです。将来別環境へ移す場合は、失敗した手順の番号と秘密情報を除いたエラー文を記録してください。

## 更新と復元

以後はmainへの更新でテスト→型チェック→ビルド→短期認証→Hosting公開→配信確認を自動実行します。
通常の公開はHostingのみが対象で、Firestoreルールの権限を自動的に変更しません。
戻す場合はGitHubで対象コミットをrevertし、同じ公開処理を通します。

## 公式資料

- https://firebase.google.com/docs/hosting/github-integration
- https://github.com/google-github-actions/auth
- https://firebase.google.com/docs/firestore/query-data/aggregation-queries
