# 初回Push前の最終確認

2026-11-01。Commit・Push・GitHub設定変更は実施していません。

| 確認項目 | 結果 |
|---|---|
| ワークフロー | .github/workflows/pages.yml が存在。mainへのpush、および手動実行で起動。実行者はyusukemurayamaに限定。 |
| 一連の公開処理 | 同じPublish siteワークフローでテスト→build.py→成果物アップロード→Pagesデプロイ。記事JSONからposts.js、掲載設定とGit履歴からhome-selection.jsを生成。deployはbuild成功時のみ実行。 |
| 成果物 | _siteに502ファイル。HTML3、CSS5、JS7、管理設定YML1、画像485、.nojekyll。admin/index.htmlとadmin/config.ymlを含む。 |
| 非公開物除外 | .git、content、scripts、docs、制作資料、検査ログを含まない。認証トークン形式・秘密鍵・Windowsローカル参照の検査で検出なし。 |
| 既存内容維持 | 195記事の全公開データが従来posts.jsと一致。アイキャッチ195件。トップの本文・写真・静的構造はCMS導入前と一致。掲載各5本の順序・件名・日付・短い見出しも一致。 |
| PAT構成 | backend github、対象リポジトリ固定、main、auth_methods token、publish_mode simple。Contents Read and writeと自動付与Metadata Read-onlyで保存する公式構成。Pull requests、Workflows権限やOAuthサーバーは不要。 |

## 今回の修正

scripts/build.py:
- 公開ファイルの一覧を明示し、adminはindex.html/config.ymlだけをコピー。
- assetsには対応画像だけを許可し、隠しファイル・リンクを拒否。
- 前回出力に残った余分なファイルやフォルダを検出してビルド停止。無断で削除せず、Pagesへの混入を防止。
- コピー後にも成果物一覧を照合。

scripts/test_build.py:
- 出力先にprivate-notes.txtまたは空の.gitフォルダがある場合に停止する回帰テストを追加。いずれも隔離したテスト用出力先で検証。

## 実行した検証

- scripts/test_build.py: 成功。画像あり/なし記事、変更・削除、本文リンク、トップ掲載の独立性、掲載設定変更、入力不正時停止、公開対象外ファイル混入時停止。
- scripts/build.py: 成功。既存195記事を生成。
- 公開ファイルのローカル参照497ファイルを検査。参照切れ0、大文字小文字不一致0。
- トップ掲載: メディア2082/1997/1973/1967/1950、講演2111/2107/2020/2011/1992。
- git diff --check: 成功。
- 今回の変更は生成・検査コードのみ。画面CSS・本文・画像の変更なし。

## 本番で必要な条件

GitHub PagesのSourceはGitHub Actionsを選択してください。mainへの本人の直接保存を禁止するブランチルールがある場合は、CMSのsimple workflowから保存できません。ご本人の直接保存が許可される設定が必要です。

PATは本人アカウントで発行し、Only select repositoriesで対象リポジトリだけを選びます。CMSの日常保存にWorkflows権限は不要です。今回のワークフロー追加・更新の初回Pushは、GitHub Desktopの通常認証を使用します。

Pages配信用のpages:write/id-token:writeはActionsジョブのGitHub認証に設定済みです。これをCMS用PATへ追加する必要はありません。

PATによる本番保存とGitHub上のActionsデプロイは未実行です。今回の成功はローカル生成・構成検証の結果であり、本番公開成功を意味しません。

公式仕様: https://sveltiacms.app/en/docs/backends/github
