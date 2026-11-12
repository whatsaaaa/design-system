#!/bin/sh
# Runs the browser tests in the Playwright container: the environment CI uses, and the only
# one in which the screenshots are compared. Arguments go to "playwright test".
#
#   sh scripts/browser-tests-in-docker.sh                      compare
#   sh scripts/browser-tests-in-docker.sh --update-snapshots   take the screenshots again
#
# The container gets a copy of the repository and installs its own dependencies, because
# the ones on the host are built for the host. The screenshots are copied back.
set -eu

root=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
version=$(node -p "require('$root/node_modules/@playwright/test/package.json').version")
image="mcr.microsoft.com/playwright:v$version-noble"
shots="$root/tests/browser/__screenshots__"
mkdir -p "$shots"

docker run --rm --ipc=host \
  -v "$root":/repo:ro \
  -v "$shots":/shots \
  "$image" sh -euc '
    mkdir /work
    cd /repo
    tar -cf - \
      --exclude=./node_modules --exclude=./dist --exclude=./.git \
      --exclude=./styleguide/.vitepress/cache --exclude=./styleguide/.vitepress/dist \
      --exclude=./styleguide/public/ds --exclude=./styleguide/public/kit \
      --exclude=./test-results --exclude=./playwright-report . | tar -xf - -C /work
    cd /work
    npm install --global --silent "$(node -p "require(\"./package.json\").packageManager")"
    pnpm install --frozen-lockfile
    pnpm build
    pnpm styleguide:build
    status=0
    CI=1 pnpm exec playwright test "$@" || status=$?
    cp -R tests/browser/__screenshots__/. /shots/ 2>/dev/null || true
    exit $status
  ' sh "$@"
