# Sveltia CMS 操作マニュアル

## 初回公開（今回だけ）

この変更はローカルに準備済みです。まだCommit・Pushしていません。

1. GitHub Desktopで変更を確認し、Commit → Push originを行います。
2. GitHubの対象リポジトリで Settings → Pages → Build and deployment → Source を **GitHub Actions** にします。
3. Actionsで「Publish site」を開きます。実行がなければ Run workflow を押します。実行名は `.github/workflows/pages.yml` のnameを参照してください。
4. buildとdeployが緑になってから公開サイトを確認します。
5. 管理画面は https://yusukemurayama.github.io/admin/ です。独自ドメイン切り替え後は、そのドメインの `/admin/` です。

公開用ファイルはActionsが `_site` に生成します。GitHub Desktopで根元のposts.jsを手動更新する運用は不要です。content・scripts・docs・検査ログは公開サイトへ配信しません。GitHubの公開リポジトリではソース自体は閲覧できます。秘密情報は置かないでください。

## 自分専用トークンの発行

1. GitHubに **yusukemurayama** でログインします。
2. 右上の顔アイコン → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token。
3. 名前は「村山サイト CMS」など。期限は管理できる期間（例90日）を選びます。
4. Resource owner は yusukemurayama。Repository accessは **Only select repositories**、対象は **yusukemurayama.github.ioだけ**。
5. Repository permissionsの **ContentsをRead and write** にします。MetadataのRead-onlyは自動付与されます。それ以外は付けません。Actions・Workflows・Pull requestsの権限は不要です。
6. Generate tokenで発行します。表示される値はこのときだけなので安全に保管します。チャットや記事、config.yml、ソース、GitHubリポジトリへ貼らないでください。

[GitHubのトークン発行画面](https://github.com/settings/personal-access-tokens/new)

## 管理画面へのログイン

WindowsのChromeで `/admin/` を開き、個人用アクセストークンによるログインを選び、トークンを入力します。Sveltia CMS公式の認証機能を使用しています。OAuth認証サーバーはありません。

公式CMSはブラウザー側に認証情報を保持します。ご自身のChromeプロフィールを使用し、共有PCでは使用後にログアウトしてください。日本語でなければCMSの設定から言語を日本語にします。

本人のみの運用はGitHubのリポジトリ権限で制御します。Settings → Collaboratorsに他の管理者を追加しないでください。CMSの画面を公開しても、書き込み権限のない閲覧者は保存できません。設定だけでGitHubの権限を取り消す機能ではありません。公開処理も実行者をyusukemurayamaに限定しています。

## 新しい活動記録を書く

「活動記録を編集」を開き、新規作成ボタンを押します。

- 記事IDは自動です。変更不要です。
- 件名、日付、本文を入力します。
- 本文のリンクは文字列を選択してリンク機能からURLを設定します。Markdownモードでも書けます。
- アイキャッチ画像は任意です。欄を開いて画像を選択・アップロードし、必要なら代替テキストを入れます。画像なしなら未設定のまま保存します。
- アップロードした写真は最大1600pxのWebPに最適化されます。既存の写真は再変換しません。
- 活動の種類・取材テーマを選びます。
- YouTube動画URLまたはX投稿URLは任意です。URLを1つ入力すれば記事に表示されます。
- アイキャッチがYouTubeサムネイルと同じ場合に限り「アイキャッチに対応するYouTube URL」を設定します。本文の同じ動画カードを省略し、写真が再生リンクになります。異なる画像には指定しません。

保存・公開操作を確定するとGitHubのmainに保存されます。承認待ち・共同編集フローはありません。Actions完了後、通常数分で公開に反映されます。無料枠の混雑等で時間は変わります。

## 記事を修正・削除する

「活動記録を編集」で件名を検索し、記事を開きます。変更して保存します。削除は記事のメニューから実行し、確認画面で確定します。

トップページで選択中の記事を削除する場合は、先に「トップページ掲載管理」で別の記事に差し替えて保存してください。選択中の記事が欠けた状態では公開処理を止め、前回の公開サイトを維持します。

既存195記事の本文を編集しない場合、従来の文章・画像位置・リンクをそのまま生成します。本文を編集するとMarkdownから安全な表示データに変換します。本文写真・キャプションを消さないよう編集してください。HTMLやスクリプトを貼る必要はありません。

## トップページに掲載する5本を選ぶ

「トップページ掲載管理」→「掲載する各5本と順番」を開きます。メディア出演、講演・講義の各欄は5本ずつです。

各行の記事選択で件名・日付を検索して選び、ドラッグ、または「上へ移動」「下へ移動」で並び順を変えます。表示用の短い件名が必要な場合だけ専用欄を入力します。空欄なら記事の件名を使います。保存して公開します。

記事の新規追加、日付変更、件名編集だけではトップページの各5本は変わりません。掲載設定を最後に保存した時点の記事情報をGitの履歴から使用します。掲載設定の選択・順序・表示件名を変更して保存した時点で更新します。同じ記事を同じ欄に重ねて選ぶことはできません。

## 公開状況を見る・エラーに対応する

GitHub → 対象リポジトリ → Actionsで最新実行を確認します。緑なら公開完了、実行中なら待ちます。赤なら該当実行のbuildを開きます。日付、選択中の記事、画像ファイル等の不足は日本語で表示されます。修正して保存すると再実行されます。失敗時は最後に成功した公開サイトが残ります。

CMS保存の直後にGitHub Desktopで作業する場合、先にFetch origin → Pull originを行い、CMSが保存した内容を取得します。

トークン期限切れなら、新しいfine-grained tokenを同じ最小権限で発行し、CMSからログアウトして再ログインします。不要な古いトークンはGitHubで削除します。設定ファイルの書き換えは不要です。

## 維持費と構成

GitHub公開リポジトリ、GitHub Pages、GitHub Actionsの標準ランナー、Sveltia CMSの公式配布を使用します。専用サーバー・有料API・OAuthサーバーは不要です。各サービスの利用制限に従います。YouTubeとXの公式外部表示は通信や相手サービスに依存し、失敗時はリンクが残ります。

CMSは0.256.1に固定しています。更新は別途動作確認後に行います。記事は `content/articles/記事ID.json`、掲載指定は `content/settings/home.json`、従来本文の互換用データは `content/legacy.json`。生成処理は `scripts/build.py`。既存のposts.jsを編集するのではなくCMSから記事を編集します。

[公式GitHub認証説明](https://sveltiacms.app/en/docs/backends/github) / [GitHub PagesのActions公開説明](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
