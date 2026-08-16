#!/usr/bin/env python3
"""Normalize static SEO metadata using the maintained Node.js tool.

Structured data is injected consistently at runtime by the Cloudflare Pages
middleware in functions/_middleware.js. This compatibility wrapper prevents the
old Windows-only script from recreating malformed breadcrumb URLs.
"""

from pathlib import Path
import subprocess


SITE_ROOT = Path(__file__).resolve().parent
REPO_ROOT = SITE_ROOT.parents[1]
NORMALIZER = REPO_ROOT / "scripts" / "normalize-static-seo.mjs"
SEO_CHECK = REPO_ROOT / "scripts" / "seo-check.mjs"


def main() -> None:
    subprocess.run(["node", str(NORMALIZER)], cwd=REPO_ROOT, check=True)
    subprocess.run(["node", str(SEO_CHECK)], cwd=REPO_ROOT, check=True)
    print("Static metadata normalized. Runtime JSON-LD is managed by Cloudflare middleware.")


if __name__ == "__main__":
    main()
