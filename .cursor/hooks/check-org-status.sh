#!/bin/bash
# Remind to commit/push the nested org/ repo (gitignored in the main repo).
set -euo pipefail

ORG_DIR="org"

emit_followup() {
	python3 -c 'import json, sys; print(json.dumps({"followup_message": sys.argv[1]}))' "$1"
}

area_label() {
	case "$1" in
		metrics) echo "metrics" ;;
		funding) echo "funding" ;;
		launch) echo "launch" ;;
		outreach) echo "outreach" ;;
		legal) echo "legal" ;;
		assets) echo "brand assets" ;;
		overview) echo "org overview" ;;
		*) echo "$1" ;;
	esac
}

join_labels() {
	local -n items=$1
	local count=${#items[@]}
	case "$count" in
		0) echo "" ;;
		1) echo "${items[0]}" ;;
		2) echo "${items[0]} and ${items[1]}" ;;
		*)
			local joined=""
			local i
			for ((i = 0; i < count - 1; i++)); do
				if [ -n "$joined" ]; then
					joined+=", ${items[$i]}"
				else
					joined="${items[$i]}"
				fi
			done
			echo "${joined}, and ${items[$((count - 1))]}"
			;;
	esac
}

generate_commit_message() {
	local status="$1"
	local -A area_set=()

	while IFS= read -r line; do
		[ -z "$line" ] && continue
		local file="${line:3}"
		local area
		if [[ "$file" == */* ]]; then
			area="${file%%/*}"
		else
			area="overview"
		fi
		area_set["$area"]=1
	done <<<"$status"

	local area_count=${#area_set[@]}
	if [ "$area_count" -eq 0 ]; then
		echo "Update org docs."
		return
	fi

	if [ "$area_count" -eq 1 ]; then
		local only=""
		for key in "${!area_set[@]}"; do
			only="$key"
		done
		case "$only" in
			metrics)
				if grep -q 'snapshot.ts' <<<"$status"; then
					echo "Add metrics snapshot script and refresh proof points."
					return
				fi
				echo "Refresh metrics proof points."
				return
				;;
			funding)
				if grep -q 'program-list' <<<"$status"; then
					echo "Restructure funding docs into playbook, program catalog, and tracker."
					return
				fi
				echo "Update funding pipeline docs."
				return
				;;
			launch)
				echo "Add launch playbook, target list, and tracker."
				return
				;;
			outreach)
				echo "Refresh outreach playbooks, templates, and tracker."
				return
				;;
			legal)
				echo "Add legal docs: entity playbook, privacy, and terms."
				return
				;;
			assets)
				echo "Add brand assets and org asset guidelines."
				return
				;;
			overview)
				echo "Update org overview and folder index."
				return
				;;
		esac
	fi

	local labels=()
	local area
	for area in metrics funding launch outreach legal assets overview; do
		if [ -n "${area_set[$area]+x}" ]; then
			labels+=("$(area_label "$area")")
		fi
	done
	for area in "${!area_set[@]}"; do
		case "$area" in
			metrics | funding | launch | outreach | legal | assets | overview) continue ;;
		esac
		labels+=("$(area_label "$area")")
	done

	echo "Update org operating docs: $(join_labels labels)."
}

build_commit_push_command() {
	local commit_message="$1"
	cat <<OUTER
(cd org && git add -A && git commit -m "\$(cat <<'MSG'
${commit_message}
MSG
)" && git push origin main)
OUTER
}

if [ ! -d "$ORG_DIR/.git" ]; then
	echo "{}"
	exit 0
fi

(
	cd "$ORG_DIR"

	STATUS=$(git status --porcelain)
	UNPUSHED=0
	if git rev-parse --verify origin/main >/dev/null 2>&1; then
		UNPUSHED=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
	fi

	if [ -z "$STATUS" ] && [ "${UNPUSHED:-0}" -eq 0 ]; then
		exit 1
	fi

	COMMIT_MESSAGE=""
	COMMAND=""

	if [ -n "$STATUS" ]; then
		COMMIT_MESSAGE=$(generate_commit_message "$STATUS")
		COMMAND=$(build_commit_push_command "$COMMIT_MESSAGE")
	fi

	if [ -n "$STATUS" ] && [ "${UNPUSHED:-0}" -gt 0 ]; then
		MSG="⚠️ **org/** has uncommitted changes and ${UNPUSHED} unpushed commit(s). This repo is separate from the main app (gitignored), so Cursor Changes will not show it.

Run:

\`\`\`bash
${COMMAND}
\`\`\`"
	elif [ -n "$STATUS" ]; then
		MSG="⚠️ **org/** has uncommitted changes. This repo is separate from the main app (gitignored), so Cursor Changes will not show it.

Run:

\`\`\`bash
${COMMAND}
\`\`\`"
	else
		MSG="⚠️ **org/** has ${UNPUSHED} unpushed commit(s). This repo is separate from the main app (gitignored), so Cursor Changes will not show it.

Run:

\`\`\`bash
cd org && git push origin main
\`\`\`"
	fi

	emit_followup "$MSG"
) || echo "{}"
