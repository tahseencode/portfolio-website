with open('app.js', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip().startswith('(function') or 'addEventListener' in line:
        if line.strip().startswith('(function'):
            print(f"Line {i+1}: {line.strip()[:60]}")
