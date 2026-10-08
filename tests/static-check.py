"""Check static document structure and repository-relative resources."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parent.parent
class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.refs, self.tags = [], [], []
        self.lang = self.viewport = self.charset = False
    def handle_starttag(self, tag, attrs):
        a = dict(attrs); self.tags.append(tag)
        if 'id' in a: self.ids.append(a['id'])
        for key in ('src','href'):
            if key in a: self.refs.append(a[key])
        self.lang |= tag == 'html' and a.get('lang') == 'ko'
        self.viewport |= tag == 'meta' and a.get('name') == 'viewport'
        self.charset |= tag == 'meta' and a.get('charset','').lower() == 'utf-8'

files=[ROOT/'index.html',*sorted((ROOT/'projects').glob('*/index.html'))]
errors=[]
for f in files:
    d=Document(); text=f.read_text(); d.feed(text)
    for valid, label in [(d.lang,'lang=ko'),(d.viewport,'viewport'),(d.charset,'UTF-8'),(len(d.ids)==len(set(d.ids)),'unique ids'),(text.lstrip().lower().startswith('<!doctype html>'),'doctype')]:
        if not valid: errors.append(f'{f.relative_to(ROOT)}: {label}')
    for ref in d.refs:
        u=urlsplit(ref)
        if u.scheme or u.netloc or not u.path: continue
        target=(ROOT/unquote(u.path).lstrip('/')) if u.path.startswith('/') else (f.parent/unquote(u.path))
        if target.is_dir(): target=target/'index.html'
        if not target.is_file(): errors.append(f'{f.relative_to(ROOT)}: missing {ref}')
    print(f'CHECK {f.relative_to(ROOT)}: {len(d.ids)} ids, {len(d.refs)} references')
if errors: raise SystemExit('\n'.join(errors))
print(f'PASS: {len(files)} documents; local links and resources resolve. External reachability not tested.')
