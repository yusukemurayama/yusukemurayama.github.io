from pathlib import Path
import argparse,copy,datetime,hashlib,json,re,shutil,subprocess
from urllib.parse import urlsplit,urlunsplit,parse_qsl,urlencode,unquote
from html.parser import HTMLParser
from markdown_it import MarkdownIt

CATEGORIES={'執筆・配信','メディア出演','講演・講義','お知らせ'}
TOPICS={'移民・難民','戦争・人道危機','開発・援助','ジャーナリズム','そのほか'}
PUBLIC_FILES=['analytics.js','favicon.ico','favicon-16x16.png','favicon-32x32.png','language.js','language.css','contact/index.html','contact/contact.css','.nojekyll','index.html','archive.html','style.css','bold.css','boat.css','site-header.css','archive-media.css','archive-media.js','archive.js','gallery.js','recent-works.js','archive-photos.js']
ALLOWED_TAGS={'p','br','strong','em','s','a','img','blockquote','ul','ol','li','h1','h2','h3','h4','h5','h6','pre','code','hr'}

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def write_js(path,name,value):
    path.write_text('window.'+name+' = '+json.dumps(value,ensure_ascii=False).replace('<','\\u003c')+';\n',encoding='utf-8')

def local_asset(root,value):
    if not isinstance(value,str) or not value:
        raise ValueError('画像パスが空です')
    path=unquote(value.lstrip('/'))
    if not path.startswith('assets/') or '..' in Path(path).parts or '\\' in path:
        raise ValueError('画像はassetsフォルダ内のファイルを指定してください '+value)
    full=root/path
    if not full.is_file() or full.relative_to(root).as_posix()!=path:
        raise ValueError('画像ファイルがありません '+value)
    # Windows also accepts wrong filename case. Check each path component explicitly.
    folder=root
    for part in Path(path).parts:
        if part not in {p.name for p in folder.iterdir()}:
            raise ValueError('画像ファイル名の大文字・小文字が一致しません '+value)
        folder=folder/part
    if full.suffix.lower() not in {'.jpg','.jpeg','.png','.webp','.gif','.svg'}:
        raise ValueError('未対応の画像形式 '+value)
    return path

def link_url(url):
    parsed=urlsplit(url)
    if parsed.scheme not in {'https','http'} or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError('HTTP(S)のURLを指定してください '+url)
    return url

class Nodes(HTMLParser):
    def __init__(self,root):
        super().__init__()
        self.root=root
        self.nodes=[]
        self.stack=[self.nodes]
        self.links=[]
        self.words=[]

    def handle_starttag(self,tag,attrs):
        if tag not in ALLOWED_TAGS:
            raise ValueError('許可されていない本文要素 '+tag)
        attrs=dict(attrs)
        node={'tag':tag,'children':[]}
        if tag=='a':
            node['href']=link_url(attrs['href'])
            self.links.append(node['href'])
        if tag=='img':
            node['src']=local_asset(self.root,attrs['src'])
            node['alt']=attrs.get('alt','')
        self.stack[-1].append(node)
        if tag not in {'img','br','hr'}:
            self.stack.append(node['children'])
        else:
            self.words.append('\n' if tag=='br' else '')

    def handle_endtag(self,tag):
        if tag not in {'img','br','hr'}:
            self.stack.pop()
        if tag in {'p','li','blockquote','pre','h1','h2','h3','h4','h5','h6'}:
            self.words.append('\n')

    def handle_data(self,text):
        self.stack[-1].append({'text':text})
        self.words.append(text)

def validate(record,filename,legacy):
    id=record.get('id','')
    if not isinstance(id,str) or id!=filename:
        raise ValueError('記事IDとファイル名が一致しません '+filename)
    if id not in legacy and not re.fullmatch(r'post-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}',id):
        raise ValueError('新規記事IDは自動発行されたpost-UUIDを使ってください '+id)
    if not isinstance(record.get('title'),str) or not record['title'].strip():
        raise ValueError('記事タイトルが空です '+id)
    date=record.get('date','')
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}',date):
        raise ValueError('日付はYYYY-MM-DDで指定してください '+id)
    datetime.date.fromisoformat(date)
    if not isinstance(record.get('body'),str) or not record['body'].strip():
        raise ValueError('記事本文が空です '+id)
    for key,choices in [('categories',CATEGORIES),('topics',TOPICS)]:
        values=record.get(key) or []
        if not isinstance(values,list) or not all(isinstance(v,str) and v in choices for v in values):
            raise ValueError('分類またはテーマが不正です '+id+' '+key)

def compile_post(root,record,legacy):
    id=record['id']
    original=legacy.get(id)
    preserve=original and original['body']==record['body']
    post=copy.deepcopy(original['post']) if original else {'id':id,'url':'','detailedCategories':[],'detailedTopics':[]}
    for key in ['title','date','categories','topics']:
        post[key]=record.get(key) or ([] if key in ['categories','topics'] else '')
    post['year']=record['date'][:4]
    if not preserve:
        parser=Nodes(root)
        parser.feed(MarkdownIt('commonmark',{'html':False,'breaks':True}).render(record['body']))
        post.update(bodyNodes=parser.nodes,text=''.join(parser.words).strip(),links=list(dict.fromkeys(parser.links)),bodyLinks=[])
    featured=record.get('featuredImage') or {}
    if not featured.get('src'):
        post['featuredImage']=None
    else:
        source=local_asset(root,featured['src'])
        previous=original['post'].get('featuredImage',{}) if original else {}
        unchanged=source==previous.get('src')
        thumb=previous.get('thumbnail') if unchanged else source
        new={'src':source,'thumbnail':local_asset(root,thumb),'alt':featured.get('alt') or ''}
        if unchanged and previous.get('inlineMatches'):
            new['inlineMatches']=previous['inlineMatches']
        if featured.get('videoUrl'):
            new['videoUrl']=link_url(featured['videoUrl'])
        post['featuredImage']=new
    for field in ['youtubeUrl','xPostUrl']:
        if record.get(field):
            post[field]=link_url(record[field])
        else:
            post.pop(field,None)
    return post

def git(root,*args):
    return subprocess.check_output(['git','--no-optional-locks','-C',str(root),*args],stderr=subprocess.DEVNULL).decode('utf-8')

def home_revision(root):
    # Freeze displayed titles and dates at the last edit of the selection file.
    # A full checkout history (fetch-depth: 0) is required in Actions.
    try:
        if git(root,'status','--porcelain','--','content/settings/home.json').strip():
            return None
        return git(root,'log','-1','--format=%H','--','content/settings/home.json').strip() or None
    except (subprocess.CalledProcessError,FileNotFoundError):
        return None

def homepage(root,current,legacy):
    config=read(root/'content/settings/home.json')
    revision=home_revision(root)
    result={}
    for name in ['media','lecture']:
        items=config.get(name)
        if not isinstance(items,list) or len(items)!=5:
            raise ValueError(name+' の掲載記事は5本を選択してください')
        if len({item['post'] for item in items})!=5:
            raise ValueError(name+' に同じ記事が重複しています')
        result[name]=[]
        for item in items:
            id=item['post']
            if id not in current:
                raise ValueError('トップページに選択中の記事がありません。掲載管理で選び直してください '+id)
            record=current[id]
            if revision:
                try:
                    record=json.loads(git(root,'show',revision+':content/articles/'+id+'.json'))
                except subprocess.CalledProcessError as error:
                    raise ValueError('掲載設定保存時点の記事がありません '+id) from error
            result[name].append({'id':id,'date':record['date'],'title':item.get('displayTitle') or record['title'],'compact':bool(item.get('displayTitle'))})
    return result

def publication_manifest(root):
    files=set(PUBLIC_FILES+['admin/index.html','admin/config.yml','posts.js','home-selection.js'])
    image_types={'.jpg','.jpeg','.png','.webp','.gif','.svg'}
    for path in (root/'assets').rglob('*'):
        if path.is_symlink() or getattr(path,'is_junction',lambda:False)():
            raise ValueError('公開画像内のリンクは許可されません '+str(path))
        relative=path.relative_to(root)
        if any(part.startswith('.') for part in relative.parts):
            raise ValueError('公開画像内に隠しファイルがあります '+str(relative))
        if path.is_file():
            if path.suffix.lower() not in image_types:
                raise ValueError('公開画像以外のファイルがあります '+str(relative))
            files.add(relative.as_posix())
    return files


def verify_publication(output,manifest,complete=False):
    # Refuse stale output or unexpected files; never silently publish or delete them.
    if output.is_symlink() or getattr(output,'is_junction',lambda:False)():
        raise ValueError('公開出力先にリンクは使用できません')
    directories={str(parent).replace('\\','/') for name in manifest for parent in Path(name).parents if str(parent)!='.'}
    actual=set()
    for path in output.rglob('*'):
        relative=path.relative_to(output).as_posix()
        if path.is_symlink() or getattr(path,'is_junction',lambda:False)():
            raise ValueError('公開成果物にリンクがあります '+relative)
        if path.is_file():
            actual.add(relative)
            if relative not in manifest:
                raise ValueError('公開対象外のファイルがあります '+relative)
        elif relative not in directories:
            raise ValueError('公開対象外のフォルダがあります '+relative)
    if complete and actual!=manifest:
        raise ValueError('公開成果物が不足しています '+', '.join(sorted(manifest-actual)))


def version_assets(output):
    """Change only local JS/CSS references, after all generated data is written."""
    def replace_tag(match, page):
        tag=match.group(0)
        def replace_url(attr):
            url=attr.group(3)
            parsed=urlsplit(url)
            if parsed.scheme or parsed.netloc or Path(parsed.path).suffix not in {'.js','.css'}:
                return attr.group(0)
            path=(output/parsed.path.lstrip('/')) if parsed.path.startswith('/') else page.parent/parsed.path
            path=path.resolve()
            if not path.is_relative_to(output) or not path.is_file():
                raise ValueError('JS/CSS参照がありません '+url)
            digest=hashlib.sha256(path.read_bytes()).hexdigest()[:20]
            query=[(key,value) for key,value in parse_qsl(parsed.query,keep_blank_values=True) if key!='v']
            query.append(('v',digest))
            updated=urlunsplit((parsed.scheme,parsed.netloc,parsed.path,urlencode(query),parsed.fragment))
            return attr.group(1)+attr.group(2)+updated+attr.group(2)
        return re.sub(r"((?:src|href)=)([\"'])(.*?)(?:\2)",replace_url,tag,flags=re.IGNORECASE)
    for page in output.rglob('*.html'):
        source=page.read_text('utf8')
        updated=re.sub(r'<(?:script|link)\b[^>]*>',lambda match:replace_tag(match,page),source,flags=re.IGNORECASE)
        page.write_text(updated,encoding='utf8')


def build(root,output):
    root=root.resolve()
    output=output.resolve()
    if output==root or root.is_relative_to(output):
        raise ValueError('出力先は専用フォルダを指定してください')
    legacy=read(root/'content/legacy.json')
    records={}
    for path in sorted((root/'content/articles').glob('*.json')):
        record=read(path)
        validate(record,path.stem,legacy)
        if record['id'] in records:
            raise ValueError('記事IDが重複しています '+record['id'])
        records[record['id']]=record
    posts=[compile_post(root,p,legacy) for p in records.values()]
    posts.sort(key=lambda p:(p['date'],int(p['id']) if p['id'].isdigit() else -1,p['id']),reverse=True)
    home=homepage(root,records,legacy)
    manifest=publication_manifest(root)
    verify_publication(output,manifest)
    # Validate everything before touching the previously generated directory.
    output.mkdir(parents=True,exist_ok=True)
    for name in PUBLIC_FILES:
        (output/name).parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(root/name,output/name)
    for name in sorted(manifest):
        if name.startswith(('assets/','admin/')):
            (output/name).parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(root/name,output/name)
    write_js(output/'posts.js','ARCHIVE_POSTS',posts)
    write_js(output/'home-selection.js','HOME_SELECTION',home)
    version_assets(output)
    verify_publication(output,manifest,complete=True)
    return posts,home

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    try:
        posts,home=build(args.root,args.output or args.root/'_site')
        print(f'公開ファイルを生成しました。記事 {len(posts)} 件、掲載欄 {len(home)} 件')
    except (ValueError,KeyError,TypeError,OSError) as error:
        raise SystemExit('公開を中止しました。'+str(error))
