import re
import os
import glob

def audit():
    print("=== AUDIT START ===")
    with open('app.js', encoding='utf-8') as f:
        js = f.read()

    with open('index.html', encoding='utf-8') as f:
        html = f.read()

    with open('style.css', encoding='utf-8') as f:
        css = f.read()

    # 1. Missing IDs referenced in JS
    ids_js = set(re.findall(r"getElementById\(['\"](.*?)['\"]\)", js))
    ids_qs = set(re.findall(r"querySelector\(['\"]#([a-zA-Z0-9_-]+)['\"]\)", js))
    all_js_ids = ids_js.union(ids_qs)
    html_ids = set(re.findall(r'id=["\'](.*?)["\']', html))

    missing_ids = all_js_ids - html_ids
    print(f"1. IDs referenced in JS but missing in index.html: {missing_ids}")

    # 2. Check duplicate IDs in HTML
    all_html_ids_list = re.findall(r'id=["\'](.*?)["\']', html)
    seen = set()
    duplicates = set()
    for i in all_html_ids_list:
        if i in seen:
            duplicates.add(i)
        seen.add(i)
    print(f"2. Duplicate IDs in HTML: {duplicates}")

    # 3. Check internal anchor links (href="#...")
    href_anchors = re.findall(r'href=["\']#([a-zA-Z0-9_-]+)["\']', html)
    broken_anchors = [a for a in href_anchors if a not in html_ids]
    print(f"3. Broken internal anchor links: {broken_anchors}")

    # 4. Check images/assets in index.html
    srcs = re.findall(r'src=["\']([^"\']+)["\']', html)
    missing_srcs = []
    for s in srcs:
        if not s.startswith('http') and not s.startswith('data:'):
            # check local file
            clean_s = s.split('?')[0].split('#')[0]
            if clean_s.startswith('/'):
                clean_s = clean_s[1:]
            if not os.path.exists(clean_s):
                missing_srcs.append(s)
    print(f"4. Missing image/script src in index.html: {missing_srcs}")

    # 5. Check CSS url(...) references
    css_urls = re.findall(r'url\([\'"]?([^"\'\)]+)[\'"]?\)', css)
    missing_css_urls = []
    for u in css_urls:
        if not u.startswith('http') and not u.startswith('data:'):
            clean_u = u.split('?')[0].split('#')[0]
            if clean_u.startswith('/'):
                clean_u = clean_u[1:]
            if not os.path.exists(clean_u):
                missing_css_urls.append(u)
    print(f"5. Missing CSS url assets: {missing_css_urls}")

    # 6. Check JS asset references (e.g. .mp3, .png, etc.)
    js_strings = re.findall(r'[\'"]([^\'"]+\.(?:png|jpg|jpeg|webp|svg|mp3|wav|ogg|json))[\'"]', js)
    missing_js_assets = []
    for asset in js_strings:
        if not asset.startswith('http') and not asset.startswith('data:'):
            clean_a = asset.split('?')[0].split('#')[0]
            if clean_a.startswith('/'):
                clean_a = clean_a[1:]
            if not os.path.exists(clean_a):
                missing_js_assets.append(asset)
    print(f"6. Missing JS asset references: {missing_js_assets}")

    # 7. Check sub-pages
    for folder in ['ai-engineer', 'cloud-devops', 'systems-engineer', 'web-developer']:
        path = os.path.join(folder, 'index.html')
        if os.path.exists(path):
            with open(path, encoding='utf-8') as f:
                c = f.read()
            srcs = re.findall(r'src=["\']([^"\']+)["\']', c)
            for s in srcs:
                if not s.startswith('http') and not s.startswith('data:'):
                    clean_s = s.split('?')[0].split('#')[0]
                    target = os.path.normpath(os.path.join(folder, clean_s)) if not clean_s.startswith('/') else clean_s[1:]
                    if not os.path.exists(target):
                        print(f"Subpage {path} missing src: {s} -> {target}")
            links = re.findall(r'href=["\']([^"\']+)["\']', c)
            for l in links:
                if l.endswith('.css') or l.endswith('.js'):
                    target = os.path.normpath(os.path.join(folder, l)) if not l.startswith('/') else l[1:]
                    if not os.path.exists(target):
                        print(f"Subpage {path} missing asset: {l} -> {target}")

    print("=== AUDIT END ===")

if __name__ == '__main__':
    audit()
