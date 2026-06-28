#!/usr/bin/env bash
# Выполняется на VPS: распаковка уже загруженного zip (без curl с GitHub).
set -euo pipefail

REMOTE_DIR="${REMOTE_DIR:-/opt/internetaddicts}"
ZIP_PATH="${ZIP_PATH:?set ZIP_PATH}"
EXPECTED_SHA256="${EXPECTED_SHA256:-}"
PM2_APP_NAME="${PM2_APP_NAME:-internetaddicts-site}"
SERVE_PORT="${SERVE_PORT:-4321}"

SITE_ROOT="${REMOTE_DIR}/current"
TMP_UNZIP="$(mktemp -d /tmp/astro-ui-XXXXXX)"

cleanup() {
	rm -rf "$TMP_UNZIP"
}
trap cleanup EXIT

if ! command -v unzip >/dev/null 2>&1; then
	apt-get update -qq
	apt-get install -y -qq unzip
fi
if ! command -v node >/dev/null 2>&1; then
	echo >&2 "ERROR: node не найден. Сначала выполните make bootstrap-site."
	exit 1
fi
if ! command -v pm2 >/dev/null 2>&1; then
	echo >&2 "ERROR: pm2 не найден. Сначала выполните make bootstrap-site."
	exit 1
fi
if [[ ! -d "$SITE_ROOT" ]]; then
	echo >&2 "ERROR: $SITE_ROOT не найден. Сначала выполните make bootstrap-site."
	exit 1
fi
if [[ ! -f "$ZIP_PATH" ]]; then
	echo >&2 "ERROR: архив не найден: $ZIP_PATH"
	exit 1
fi

if [[ -n "$EXPECTED_SHA256" ]]; then
	echo "$EXPECTED_SHA256  $ZIP_PATH" | sha256sum -c -
fi

unzip -oq "$ZIP_PATH" -d "$TMP_UNZIP"

if [[ ! -f "$TMP_UNZIP/package.json" ]]; then
	echo >&2 "ERROR: в архиве нет package.json."
	exit 1
fi
if [[ ! -f "$TMP_UNZIP/server/entry.mjs" || ! -d "$TMP_UNZIP/client" ]]; then
	echo >&2 "ERROR: в архиве нет server/client."
	exit 1
fi
if [[ ! -f "$SITE_ROOT/package.json" ]]; then
	echo >&2 "ERROR: на сервере нет package.json. Выполните make bootstrap-site."
	exit 1
fi

old_pkg_hash="$(sha256sum "$SITE_ROOT/package.json" | awk '{print $1}')"
new_pkg_hash="$(sha256sum "$TMP_UNZIP/package.json" | awk '{print $1}')"
if [[ "$old_pkg_hash" != "$new_pkg_hash" ]]; then
	echo >&2 "ERROR: package.json изменился. Выполните make bootstrap-site."
	exit 1
fi

rm -rf "$SITE_ROOT/server" "$SITE_ROOT/client"
cp -a "$TMP_UNZIP/server" "$SITE_ROOT/"
cp -a "$TMP_UNZIP/client" "$SITE_ROOT/"
cp -f "$TMP_UNZIP/package.json" "$SITE_ROOT/package.json"
if [[ -f "$TMP_UNZIP/package-lock.json" ]]; then
	cp -f "$TMP_UNZIP/package-lock.json" "$SITE_ROOT/package-lock.json"
fi

if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
	pm2 restart "$PM2_APP_NAME" >/dev/null
else
	cd "$SITE_ROOT"
	NODE_ENV=production HOST=127.0.0.1 PORT="$SERVE_PORT" pm2 start server/entry.mjs --name "$PM2_APP_NAME" --interpreter node >/dev/null
fi
pm2 save >/dev/null

rm -f "$ZIP_PATH"
echo "OK: UI update (upload) -> $SITE_ROOT"
