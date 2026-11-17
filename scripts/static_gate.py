#!/usr/bin/env python3
"""Read-only TOPKEY static gate: JS syntax, inline HTML scripts and JSON files."""
import json
import re
import subprocess
import sys
from pathlib import Path


def main():
    topkey = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'topkey'
    repo = topkey.parent
    if not topkey.is_dir():
        print(f'FAIL missing topkey root: {topkey}')
        return 2
    checked = {'js': 0, 'inline': 0, 'json': 0}
    errors = []
    for directory in (topkey, repo / 'scripts'):
        if not directory.is_dir():
            continue
        for file in directory.rglob('*'):
            if not file.is_file():
                continue
            if file.suffix in ('.js', '.cjs', '.mjs'):
                result = subprocess.run(['node', '--check', str(file)], capture_output=True, text=True)
                checked['js'] += 1
                if result.returncode:
                    errors.append(f'{file.relative_to(repo)}: {result.stderr.strip()[:250]}')
            elif file.suffix == '.json':
                checked['json'] += 1
                try:
                    json.loads(file.read_text(encoding='utf-8'))
                except (ValueError, UnicodeError) as exc:
                    errors.append(f'{file.relative_to(repo)}: {exc}')
            elif file.suffix == '.html':
                html = file.read_text(encoding='utf-8', errors='replace')
                for match in re.finditer(r'<script\b([^>]*)>([\s\S]*?)</script>', html, re.I):
                    attrs, source = match.groups()
                    if not source.strip() or re.search(r'type=["\x27](?:application/json|application/ld\+json|text/template)["\x27]', attrs, re.I):
                        continue
                    checked['inline'] += 1
                    result = subprocess.run(['node', '--check'], input=source, capture_output=True, text=True)
                    if result.returncode:
                        errors.append(f'{file.relative_to(repo)} inline script: {result.stderr.strip()[:250]}')
    print('TOPKEY STATIC GATE: ' + ' | '.join(f'{name}={count}' for name, count in checked.items()) + f' | errors={len(errors)}')
    for error in errors:
        print('FAIL ' + error)
    return 1 if errors else 0


if __name__ == '__main__':
    sys.exit(main())
