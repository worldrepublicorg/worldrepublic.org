#!/bin/bash
# Set .cursor/.{repo}-dirty when the agent edits a file under a nested repo (org/, docs/).
set -euo pipefail

NESTED_REPOS="${NESTED_REPOS:-org docs}"

INPUT=$(cat)
FILE_PATH=$(
	printf '%s' "$INPUT" | python3 -c '
import json, sys
data = json.load(sys.stdin)
print(data.get("file_path", ""))
' 2>/dev/null || true
)

if [ -z "$FILE_PATH" ]; then
	echo "{}"
	exit 0
fi

mkdir -p .cursor

for repo in $NESTED_REPOS; do
	case "$FILE_PATH" in
		*/"$repo"/*|*/"$repo")
			touch ".cursor/.${repo}-dirty"
			;;
	esac
done

echo "{}"
