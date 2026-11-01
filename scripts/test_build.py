from pathlib import Path
import copy,json,re,shutil,subprocess,tempfile,unittest
import build

REPO=Path(__file__).resolve().parents[1]
def write(path,data):
    path.write_text(json.dumps(data,ensure_ascii=False),encoding='utf8')
def load_js(path):
    return json.loads(path.read_text('utf8').partition('=')[2].strip()[:-1])

class PublishingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory()
        cls.root=Path(cls.temp.name)/'repo'
        cls.root.mkdir()
        for folder in ['content','assets','admin']:
            shutil.copytree(REPO/folder,cls.root/folder)
        # Isolate fixtures from real CMS additions and edits.
        for path in (cls.root/'content/articles').glob('*.json'):
            path.unlink()
        cls.baseline=build.read(cls.root/'content/legacy.json')
        for id,entry in cls.baseline.items():
            post=entry['post']
            record={k:post[k] for k in ['id','title','date','categories','topics','featuredImage']}
            record['body']=entry['body']
            write(cls.root/'content/articles'/f'{id}.json',record)
        cls.selection={'media':[{'post':id,'displayTitle':''} for id in ['2082','1997','1973','1967','1950']],
                       'lecture':[{'post':id,'displayTitle':''} for id in ['2111','2107','2020','2011','1992']]}
        write(cls.root/'content/settings/home.json',cls.selection)
        for file in build.PUBLIC_FILES:
            (cls.root/file).parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(REPO/file,cls.root/file)
        def git(*args):
            subprocess.run(['git','-C',str(cls.root),*args],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        cls.git=staticmethod(git)
        cls.git('init')
        cls.git('config','user.name','CMS local test')
        cls.git('config','user.email','test@example.invalid')
        cls.git('add','.')
        cls.git('commit','-m','Initial fixture')
    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_content_and_home_are_independent(self):
        root=self.root
        original,home=build.build(root,root/'_site')
        current=sorted([entry['post'] for entry in self.baseline.values()],key=lambda p:(p['date'],int(p['id'])),reverse=True)
        self.assertEqual(current,original)
        self.assertEqual(len(original),195)
        contact=(root/'_site/contact/index.html').read_text('utf8')
        self.assertIn('viewform?embedded=true',contact)
        self.assertIn('title="村山祐介へのお問い合わせフォーム"',contact)
        self.assertIn('contact.css?v=',contact)
        for page in ['index.html','archive.html','contact/index.html']:
            self.assertNotIn('https://murayamayusuke.com/contact/',(root/'_site'/page).read_text('utf8'))
        self.assertEqual(len({p['id'] for p in original}),195)
        self.assertTrue(all(p['featuredImage'] for p in original))
        self.assertFalse((root/'_site/content').exists())
        self.assertFalse((root/'_site/scripts').exists())
        self.assertFalse((root/'_site/.github').exists())
        stray=root/'_site'/'private-notes.txt'
        stray.write_text('test fixture only',encoding='utf8')
        with self.assertRaisesRegex(ValueError,'公開対象外'):
            build.build(root,root/'_site')
        stray.unlink()
        hidden=root/'_site'/'.git'
        hidden.mkdir()
        with self.assertRaisesRegex(ValueError,'公開対象外'):
            build.build(root,root/'_site')
        hidden.rmdir()
        old_html=(root/'_site/archive.html').read_text('utf8')
        old_home=(root/'_site/index.html').read_text('utf8')
        def versions(page):
            return dict(re.findall(r'(?:src|href)="([^"?]+\.(?:js|css))\?v=([0-9a-f]{20})"',page))
        before=versions(old_html)
        self.assertIn('posts.js',before)
        self.assertIn('archive.js',before)
        self.assertIn('style.css',before)
        build.build(root,root/'_site')
        self.assertEqual((root/'_site/archive.html').read_text('utf8'),old_html)
        with (root/'archive.js').open('a',encoding='utf8') as f:f.write('\n/* cache test */')
        with (root/'style.css').open('a',encoding='utf8') as f:f.write('\n/* cache test */')
        build.build(root,root/'_site')
        changed=versions((root/'_site/archive.html').read_text('utf8'))
        self.assertNotEqual(before['archive.js'],changed['archive.js'])
        self.assertNotEqual(before['style.css'],changed['style.css'])
        self.assertEqual(before['posts.js'],changed['posts.js'])
        self.assertEqual(re.findall(r'<img[^>]+>',old_home),re.findall(r'<img[^>]+>',(root/'_site/index.html').read_text('utf8')))
        ids=['post-00000000-0000-4000-8000-000000000001','post-00000000-0000-4000-8000-000000000002']
        test={'id':ids[0],'title':'検証用の活動記録','date':'2030-01-01','body':'一段落目\n同じ段落の改行\n\n**太字** と [資料](https://example.com/report)\n\n<script>alert(1)</script>','categories':['執筆・配信'],'topics':['移民・難民'],'youtubeUrl':'https://youtu.be/l-3zHWV4-K0','xPostUrl':''}
        first=root/'content/articles'/f'{ids[0]}.json'
        second=root/'content/articles'/f'{ids[1]}.json'
        write(first,test)
        image_post={**test,'id':ids[1],'featuredImage':{'src':'/assets/portrait.jpg','alt':'テスト画像'}}
        write(second,image_post)
        new,new_home=build.build(root,root/'_site')
        self.assertEqual(len(new),197)
        self.assertNotEqual(before['posts.js'],versions((root/'_site/archive.html').read_text('utf8'))['posts.js'])
        self.assertEqual(new_home,home)
        self.assertIsNone(next(p for p in new if p['id']==ids[0])['featuredImage'])
        self.assertIn('https://example.com/report',next(p for p in new if p['id']==ids[0])['links'])
        for p in new:
            if p['id'] in ids:
                self.assertIn('<script>',p['text'])
                self.assertNotIn('"tag": "script"',json.dumps(p['bodyNodes']))
        # An archive edit must not alter any home title, date, or ordering.
        selected=home['lecture'][0]['id']
        selected_file=root/'content/articles'/f'{selected}.json'
        edited=build.read(selected_file)
        edited['title']='編集したタイトル'
        edited['date']='2031-02-03'
        write(selected_file,edited)
        self.git('add','content/articles')
        self.git('commit','-m','Archive-only changes')
        after,after_home=build.build(root,root/'_site')
        self.assertEqual(after_home,home)
        # Only changing the home settings refreshes its snapshots.
        settings=root/'content/settings/home.json'
        selection=build.read(settings)
        selection['media'][0]={'post':ids[0],'displayTitle':''}
        selection['lecture'].reverse()
        write(settings,selection)
        self.git('add','content/settings/home.json')
        self.git('commit','-m','Explicit home selection')
        after,changed_home=build.build(root,root/'_site')
        self.assertEqual(changed_home['media'][0]['id'],ids[0])
        self.assertEqual([p['id'] for p in changed_home['lecture']],[p['post'] for p in selection['lecture']])
        self.assertEqual(next(p for p in changed_home['lecture'] if p['id']==selected)['title'],edited['title'])
        first.unlink()
        with self.assertRaisesRegex(ValueError,'選択中の記事'):
            build.build(root,root/'_site')
        write(first,test)
        second.unlink()
        final,_=build.build(root,root/'_site')
        self.assertEqual(len(final),196)
        test['date']='2030-02-30'
        write(first,test)
        with self.assertRaises(ValueError):
            build.build(root,root/'_site')

if __name__=='__main__':
    unittest.main()
