#!/usr/bin/env bash
# Prepares a sanitized copy of the project with a brand-new, single-commit history.
#
#   scripts/export-sanitized.sh <new-empty-directory> [--skip-e2e]
#
# LOCAL ONLY: this script never contacts GitHub, creates no remote and pushes nothing.
# It exports only the committed files of the current branch (no history), removes archive-only
# material, strips internal notes, verifies the result, and records one fresh commit.
set -euo pipefail

OUT="${1:?usage: scripts/export-sanitized.sh <new-empty-directory> [--skip-e2e]}"
SKIP_E2E="${2:-}"
SRC="$(git rev-parse --show-toplevel)"

if [ -e "$OUT" ] && [ -n "$(ls -A "$OUT" 2>/dev/null)" ]; then echo "Target directory must be empty or absent: $OUT" >&2; exit 1; fi
if ! git -C "$SRC" diff --quiet || ! git -C "$SRC" diff --cached --quiet; then echo "Commit or stash your changes first." >&2; exit 1; fi

AUTHOR_NAME="${GIT_AUTHOR_NAME:-$(git -C "$SRC" config user.name)}"
AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-$(git -C "$SRC" config user.email)}"

echo "1/6 Exporting committed files (no Git history) to $OUT"
mkdir -p "$OUT"
git -C "$SRC" archive HEAD | tar -x -C "$OUT"
cd "$OUT"

echo "2/6 Removing archive-only material"
rm -rf assets/unverified-third-party docs/release-readiness.md docs/original-audit.md docs/two-editions-strategy.md
# The legacy builder reads the private archive's `main`; the public repository keeps only its sanitized output (public/legacy).
rm -f scripts/build-legacy.mjs
node -e 'const f="package.json",p=JSON.parse(require("fs").readFileSync(f));delete p.scripts.legacy;require("fs").writeFileSync(f,JSON.stringify(p,null,2)+"\n")'

echo "3/6 Stripping internal notes from the documentation"
node --input-type=module -e '
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
const files = ["README.md", ...readdirSync("docs").filter((f) => f.endsWith(".md")).map((f) => `docs/${f}`)];
for (const f of files) {
  const text = readFileSync(f, "utf8")
    .replace(/<!-- internal:start -->[\s\S]*?<!-- internal:end -->\n?/g, "")
    .replace(/<!-- public: ([\s\S]*?) -->/g, "$1");
  writeFileSync(f, text);
}'
# Tests and scripts may name the quarantine folder (to guard against shipping it); documentation must not.
if grep -rnE "internal:(start|end)|release-readiness|original-audit|two-editions-strategy|build-legacy|unverified-third-party" README.md docs src package.json 2>/dev/null; then
  echo "Leftover references to archive-only material (listed above). Fix the sources and retry." >&2; exit 1
fi

echo "4/6 Installing and verifying (unit tests include the privacy scan; the build is scanned too)"
npm ci --silent
npm test
npm run build
npm test   # second run scans dist/ as well
if [ "$SKIP_E2E" != "--skip-e2e" ]; then npm run test:e2e; fi

echo "5/6 Creating a brand-new repository history"
rm -rf node_modules dist
git init -q -b main
git add -A
GIT_AUTHOR_NAME="$AUTHOR_NAME" GIT_AUTHOR_EMAIL="$AUTHOR_EMAIL" GIT_COMMITTER_NAME="$AUTHOR_NAME" GIT_COMMITTER_EMAIL="$AUTHOR_EMAIL" \
  git commit -q -m "Initial version of the 2026 Zain El Deen Store showcase" \
  -m "Bilingual (English/Arabic) static storefront showcase. The original 2020 project is kept in a private family archive."

echo "6/6 Final checks"
[ "$(git rev-list --count HEAD)" = "1" ] || { echo "Expected exactly one commit" >&2; exit 1; }
[ -z "$(git branch --list | grep -v main || true)" ] || { echo "Unexpected extra branches" >&2; exit 1; }
git log --stat --oneline | tail -n 3
echo
echo "Done. $OUT contains a one-commit repository. Nothing was pushed."
echo "Next (manual, needs approval): create a PRIVATE empty repository, add it as a remote and push 'main'."
