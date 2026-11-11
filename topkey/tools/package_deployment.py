#!/usr/bin/env python3
"""Build a local deployment directory/ZIP. Does not publish or change services."""
import argparse
import json
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {'report-templates', 'tests', 'docs', 'tools', 'h105-tools', 'node_modules', '__pycache__'}
EXCLUDE_SUFFIXES = {'.pptx', '.xlsx', '.md', '.pyc'}


def include(path):
    rel = path.relative_to(ROOT)
    return not any(p in EXCLUDE_DIRS for p in rel.parts) and path.suffix.lower() not in EXCLUDE_SUFFIXES


def build(output, archive=None):
    output = output.resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError('Output must be outside the topkey source folder')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Output folder must be new or empty')
    output.mkdir(parents=True, exist_ok=True)
    files = [p for p in ROOT.rglob('*') if p.is_file()]
    kept = [p for p in files if include(p)]
    for p in kept:
        target = output / p.relative_to(ROOT)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(p, target)
    for required in ('index.html', 'sports/badminton/index.html', 'sports/vnext/index.html',
                     'ppt-report-wizard.js', 'vendor/pptxgen.bundle.js', 'vendor/jszip.min.js',
                     'sports/badminton/production-loader.js', 'system-admin.html'):
        if not (output / required).is_file():
            raise ValueError(f'Missing runtime file: {required}')
    assert not list(output.rglob('*.pptx')), 'Uploaded user templates must not be bundled'
    result = {'source_bytes': sum(p.stat().st_size for p in files),
              'deployment_bytes': sum(p.stat().st_size for p in kept),
              'files': len(kept), 'output': str(output)}
    if archive:
        archive = archive.resolve()
        if archive == output or output in archive.parents:
            raise ValueError('ZIP must be outside the deployment folder')
        archive.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for p in sorted(output.rglob('*')):
                if p.is_file():
                    z.write(p, p.relative_to(output))
        with zipfile.ZipFile(archive) as z:
            assert z.testzip() is None
        result.update(zip=str(archive), zip_bytes=archive.stat().st_size)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT.parent / 'dist')
    parser.add_argument('--zip', type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.output, args.zip), indent=2))
