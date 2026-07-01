#!/usr/bin/env bash
# Как ssh-wrap.sh, но для scp (PASSWORD из cloud/.env).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$(dirname "$SCRIPT_DIR")/.env"

read_password() {
	[[ -f "$ENV_FILE" ]] || return 1
	local line
	while IFS= read -r line || [[ -n "$line" ]]; do
		[[ "$line" =~ ^[[:space:]]*# ]] && continue
		[[ -z "${line// }" ]] && continue
		if [[ "$line" =~ ^PASSWORD=(.*)$ ]]; then
			local val="${BASH_REMATCH[1]}"
			val="${val#"${val%%[![:space:]]*}"}"
			val="${val%"${val##*[![:space:]]}"}"
			val="${val#\"}"
			val="${val%\"}"
			val="${val#\'}"
			val="${val%\'}"
			printf '%s' "$val"
			return 0
		fi
	done < "$ENV_FILE"
	return 1
}

if command -v sshpass >/dev/null 2>&1 && pass="$(read_password 2>/dev/null)" && [[ -n "$pass" ]]; then
	export SSHPASS="$pass"
	exec sshpass -e scp -o StrictHostKeyChecking=accept-new "$@"
else
	exec scp "$@"
fi
