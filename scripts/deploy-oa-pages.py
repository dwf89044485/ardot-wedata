#!/usr/bin/env python3
"""Deploy Next.js static export to OA Pages (pages.woa.com)"""
import base64
import json
import os
import ssl
import sys
import urllib.request

API_KEY = os.environ.get("OA_PAGES_API_KEY", "oa-pages-key-66323e8fc158d4ac2dd8680480830a2074a753ccdef3bed2")
CNAME = "wedata-ai.pages.woa.com"
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out")
API_BASE = "https://pages.woa.com/api"
MAX_PAYLOAD = 4 * 1024 * 1024  # 4MB per batch (under 5MB limit)

BINARY_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot", ".webp", ".avif", ".mp4", ".webm"}
SKIP_EXTS = {".txt"}
SKIP_NAMES = {".DS_Store"}


def api_request(method, path, data=None):
    url = f"{API_BASE}{path}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, method=method, headers={
        "X-Api-Key": API_KEY,
        "Content-Type": "application/json",
    })
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read()
        try:
            return e.code, json.loads(body)
        except json.JSONDecodeError:
            return e.code, {"message": body.decode(errors="replace")}


def collect_files():
    """Collect all deployable files from out/ directory"""
    files = {}
    for root, _, filenames in os.walk(OUT_DIR):
        for name in sorted(filenames):
            if name in SKIP_NAMES:
                continue
            ext = os.path.splitext(name)[1].lower()
            if ext in SKIP_EXTS:
                continue
            filepath = os.path.join(root, name)
            relpath = os.path.relpath(filepath, OUT_DIR)

            if ext in BINARY_EXTS:
                with open(filepath, "rb") as f:
                    content = base64.b64encode(f.read()).decode()
            else:
                with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()

            files[relpath] = content
    return files


def split_batches(files):
    """Split files into batches under MAX_PAYLOAD"""
    batches = []
    current = {}
    current_size = 2  # for '{}'

    for path, content in files.items():
        entry_size = len(path) + len(content) + 10  # JSON overhead
        if current_size + entry_size > MAX_PAYLOAD and current:
            batches.append(current)
            current = {}
            current_size = 2

        current[path] = content
        current_size += entry_size

    if current:
        batches.append(current)
    return batches


def main():
    if not os.path.isdir(OUT_DIR):
        print(f"Error: {OUT_DIR} not found. Run 'STATIC_EXPORT=1 npx next build' first.")
        sys.exit(1)

    print(f"=== Deploying to {CNAME} ===")

    # Collect files
    print("Collecting files...")
    files = collect_files()
    print(f"Total files: {len(files)}")
    total_size = sum(len(v) for v in files.values())
    print(f"Total payload: {total_size / 1024 / 1024:.2f} MB")

    # Split into batches
    batches = split_batches(files)
    print(f"Batches needed: {len(batches)}")

    # Check if site exists
    print("\nChecking site status...")
    status, resp = api_request("GET", f"/repos/{CNAME}")

    if status == 200:
        print(f"Site exists (visibility: {resp.get('visibility', '?')}). Updating files...")
        for i, batch in enumerate(batches):
            print(f"  Uploading batch {i+1}/{len(batches)} ({len(batch)} files)...")
            s, r = api_request("PUT", f"/sites/{CNAME}", {"files": batch})
            if s >= 400:
                print(f"  Error: {r}")
                sys.exit(1)
            print(f"  OK: {r.get('message', r)}")
    else:
        print("Site does not exist. Creating...")
        # Create with first batch
        print(f"  Creating with batch 1/{len(batches)} ({len(batches[0])} files)...")
        s, r = api_request("POST", "/sites", {
            "cname": CNAME,
            "files": batches[0],
            "description": "WeData AI Demo",
        })
        if s >= 400:
            print(f"  Error: {r}")
            sys.exit(1)
        print(f"  Created: {r}")

        # Upload remaining batches
        for i, batch in enumerate(batches[1:], 2):
            print(f"  Uploading batch {i}/{len(batches)} ({len(batch)} files)...")
            s, r = api_request("PUT", f"/sites/{CNAME}", {"files": batch})
            if s >= 400:
                print(f"  Error: {r}")
                sys.exit(1)
            print(f"  OK: {r.get('message', r)}")

    print(f"\n=== Done! ===")
    print(f"Site URL: https://{CNAME}")
    print(f"Admin:    https://pages.woa.com/admin")


if __name__ == "__main__":
    main()
