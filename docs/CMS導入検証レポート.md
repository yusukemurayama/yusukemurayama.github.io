# Sveltia CMS 導入・検証レポート

2026-11-01。対象: yusukemurayama/yusukemurayama.github.io のローカルリポジトリ。

## 実装

- /admin/: Sveltia CMS公式0.256.1。日本語フォーム、PAT認証のみ。OAuthサーバー・承認フロー・招待機能なし。
- 記事作成・編集: content/articlesに1記事1JSON。195記事を移行。ID自動生成、日付、本文Markdown、任意の画像・代替テキスト・YouTube/X URL、既存の4分類と5テーマ。
- 本文はMarkdownから許可したDOM要素用データへ変換。スクリプトを実行するHTMLの直接挿入は行わない。
- 画像: 公式メディア管理でassets/uploadsへ保存。新規アップロードは最大1600px WebP設定。既存画像は変更なし。
- トップページ: メディア出演5本・講演講義5本を記事検索から選択し並べ替え。既存各5本と短い見出しを維持。
- 掲載設定の最終変更コミット時点の記事を参照し、アーカイブの変更だけでトップの件名・日付が変わらない構成。選択中の記事が消えた場合は公開を停止。
- mainへの保存でActionsが検証・生成・Pagesへ配信。公開対象は_siteのHTML/CSS/JS/画像/adminのみ。元データ・生成コード・説明書・ログは公開サイトの配信対象外。
- 実行者をyusukemurayamaに限定。GitHub側の管理権限はリポジトリ所有者の設定が正であり、他のCollaboratorを追加しない運用。

## 変更ファイル

追加:
- admin/index.html、admin/config.yml
- content/articles/*.json（195ファイル）、content/legacy.json、content/settings/home.json
- home-selection.js
- scripts/build.py、scripts/test_build.py、scripts/requirements.txt
- .github/workflows/pages.yml、.gitignore
- docs/CMS操作マニュアル.md、docs/CMS導入検証レポート.md

変更:
- index.html（掲載リストのデータ属性・読み込みスクリプトのみ）
- recent-works.js（掲載設定による描画）
- archive.js（新しい年の検索選択肢）
- archive-media.js、archive-media.css（安全なMarkdown本文の表示と新規動画URL）
- archive.html（読み込みバージョン更新）

変更なし: 完成済みトップの本文・写真・ロゴ・ヘッダー、基本CSS、既存posts.js、archive-photos.js、既存画像資産。

## 検証済み

- Sveltia公式JSON Schemaに設定全体が適合。
- 公式テストバックエンドを使いChromeで195記事を読み込み、新規記事のID発行・日付・Markdown本文リンク・画像なしの保存を実操作で確認。保存後196記事となり、JSON内容を確認。テストはブラウザーの隔離ストレージのみ。
- 同CMSでトップの既存選択記事・日付・件名の表示を確認。「下へ移動」から先頭2記事を入れ替え、保存JSONの順序変更と各5本を確認。
- 隔離したデータ・Git履歴の自動テストで、画像あり／なし新規記事の生成、編集、削除、リンク、安全な本文変換、日付検証、トップ掲載の独立性、選択差し替え・並べ替え、選択中記事欠落時の公開停止を確認。
- 既存195件の生成済み記事オブジェクトは移行前と全項目一致。ID・件名・日付・本文・分類・画像・リンク情報を維持。
- Chrome 1280px/390pxで全195件を開き、アイキャッチ195件、本文写真75表示（77点中2点は既存の重複回避）、本文リンク239、YouTube本文カード36と対応アイキャッチ22を確認。
- Chrome 1280/320/375/390/430pxで全195件の一覧の並び・クリック、詳細の画像縦横比・画面内収まりを確認。
- Chrome 1280/320/390pxで新規画像あり・なしの2件を含む197件の隔離サイトを確認。検索、分類、テーマ、本文リンク、画像なしの非表示、横はみ出しなし。
- 元のトップ静的内容はデータ読み込み部分以外一致。既存の基本CSSと元記事データは変更なし。
- テスト記事は本番データに残していない。Commit・Push・GitHub設定変更・トークン発行は未実施。

## 本番運用前に必要な作業・未検証

- ご本人による変更確認、Commit・Push。
- GitHub PagesのSourceをGitHub Actionsに設定。公開APIの既存実行履歴は従来のPagesビルドだったため、切り替えを手動確認する。
- yusukemurayamaで対象リポジトリだけのfine-grained PATを発行。Contents Read and write、Metadata Read-onlyのみ。
- 本番CMSへのPATログイン、実際のGitHub保存、画像アップロードから自動公開までの一連の通信は未検証。今回実際の認証情報は取得していない。
- CMS画面上の画像アップロード・削除操作自体は今回のUI検証対象外。画像ありの公開生成、削除の生成処理は隔離テスト済み。
- GitHub Pagesへのデプロイと公開URLの更新結果は未検証。ローカル検証を本番公開確認とは扱っていない。
- X/YouTubeは外部サービス。今回既存データと処理の維持を確認したが、全投稿の外部動画再生・Xサーバー応答は再検証していない。

## 費用・外部サービス

Sveltia CMS、GitHub公開リポジトリ、GitHub Pages、標準GitHub Actionsで構成。有料API、専用サーバー、OAuthサーバー不要。公開リポジトリの標準Actions利用を前提とし、サービスの利用上限は適用される。

日常の操作と初回設定は同じフォルダのCMS操作マニュアル.mdを参照。
