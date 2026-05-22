#!/bin/bash
# Nested repo sync helper (org/, docs/) — gitignored in main repo.
# Hook mode (default): emit followup on stop if .cursor/.{repo}-dirty was set.
# Report mode (--report): print status for all or one repo (--repo NAME).
set -euo pipefail

NESTED_REPOS="${NESTED_REPOS:-org docs}"

emit_followup() {
	python3 -c 'import json, sys; print(json.dumps({"followup_message": sys.argv[1]}))' "$1"
}

# --- org commit messages ---

org_area_label() {
	case "$1" in
		metrics) echo "metrics" ;;
		capital) echo "capital" ;;
		distribution) echo "distribution" ;;
		relationships) echo "relationships" ;;
		legal) echo "legal" ;;
		assets) echo "brand assets" ;;
		product) echo "product" ;;
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

generate_org_commit_message() {
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
			capital) echo "Update capital pipeline docs." ;;
			distribution) echo "Update distribution pipeline docs." ;;
			relationships) echo "Update relationships pipeline docs." ;;
			legal) echo "Update legal docs." ;;
			product) echo "Update product backlog and playbook." ;;
			assets) echo "Update brand assets and org asset guidelines." ;;
			overview) echo "Update org overview and folder index." ;;
			*) echo "Update org operating docs: $(org_area_label "$only")." ;;
		esac
		return
	fi

	local labels=()
	local area
	for area in metrics capital distribution relationships legal product assets overview; do
		if [ -n "${area_set[$area]+x}" ]; then
			labels+=("$(org_area_label "$area")")
		fi
	done
	for area in "${!area_set[@]}"; do
		case "$area" in
			metrics | capital | distribution | relationships | legal | product | assets | overview) continue ;;
		esac
		labels+=("$(org_area_label "$area")")
	done

	echo "Update org operating docs: $(join_labels labels)."
}

# --- docs commit messages ---

docs_area_label() {
	case "$1" in
		quickstart) echo "quickstart" ;;
		building-blocks) echo "building blocks" ;;
		help-center) echo "help center" ;;
		campaigns) echo "campaigns" ;;
		organization) echo "organization" ;;
		templates) echo "templates" ;;
		images) echo "images" ;;
		fonts) echo "fonts" ;;
		overview) echo "wiki overview" ;;
		*) echo "$1" ;;
	esac
}

docs_area_from_file() {
	local file="$1"
	case "$file" in
		quickstart*) echo "quickstart" ;;
		quickstart/*) echo "quickstart" ;;
		building-blocks*) echo "building-blocks" ;;
		building-blocks/*) echo "building-blocks" ;;
		help-center*) echo "help-center" ;;
		help-center/*) echo "help-center" ;;
		campaigns*) echo "campaigns" ;;
		campaigns/*) echo "campaigns" ;;
		organization*) echo "organization" ;;
		organization/*) echo "organization" ;;
		templates*) echo "templates" ;;
		templates/*) echo "templates" ;;
		images/*) echo "images" ;;
		fonts/*) echo "fonts" ;;
		*) echo "overview" ;;
	esac
}

generate_docs_commit_message() {
	local status="$1"
	local -A area_set=()

	while IFS= read -r line; do
		[ -z "$line" ] && continue
		local file="${line:3}"
		local area
		area=$(docs_area_from_file "$file")
		area_set["$area"]=1
	done <<<"$status"

	local area_count=${#area_set[@]}
	if [ "$area_count" -eq 0 ]; then
		echo "Update wiki docs."
		return
	fi

	if [ "$area_count" -eq 1 ]; then
		local only=""
		for key in "${!area_set[@]}"; do
			only="$key"
		done
		case "$only" in
			quickstart) echo "Update quickstart guides." ;;
			building-blocks) echo "Update building blocks docs." ;;
			help-center) echo "Update help center." ;;
			campaigns) echo "Update campaign docs." ;;
			organization) echo "Update organization docs." ;;
			templates) echo "Update doc templates." ;;
			images) echo "Update wiki images." ;;
			fonts) echo "Update wiki fonts." ;;
			overview) echo "Update wiki overview and navigation." ;;
			*) echo "Update wiki docs: $(docs_area_label "$only")." ;;
		esac
		return
	fi

	local labels=()
	local area
	for area in quickstart building-blocks help-center campaigns organization templates images fonts overview; do
		if [ -n "${area_set[$area]+x}" ]; then
			labels+=("$(docs_area_label "$area")")
		fi
	done
	for area in "${!area_set[@]}"; do
		case "$area" in
			quickstart | building-blocks | help-center | campaigns | organization | templates | images | fonts | overview) continue ;;
		esac
		labels+=("$(docs_area_label "$area")")
	done

	echo "Update wiki docs: $(join_labels labels)."
}

generate_commit_message() {
	local repo="$1"
	local status="$2"
	case "$repo" in
		org) generate_org_commit_message "$status" ;;
		docs) generate_docs_commit_message "$status" ;;
		*) echo "Update ${repo}." ;;
	esac
}

build_commit_push_command() {
	local repo="$1"
	local commit_message="$2"
	cat <<OUTER
(cd ${repo} && git add -A && git commit -m "\$(cat <<'MSG'
${commit_message}
MSG
)" && git push origin main)
OUTER
}

build_repo_status_message() {
	local repo="$1"
	local status="$2"
	local unpushed="$3"
	local command=""

	if [ -n "$status" ]; then
		local commit_message
		commit_message=$(generate_commit_message "$repo" "$status")
		command=$(build_commit_push_command "$repo" "$commit_message")
	fi

	if [ -n "$status" ] && [ "${unpushed:-0}" -gt 0 ]; then
		printf '%s\n\n%s\n\n```bash\n%s\n```' \
			"⚠️ **${repo}/** has uncommitted changes and ${unpushed} unpushed commit(s). This repo is separate from the main app (gitignored), so Cursor Changes will not show it." \
			"Run:" \
			"$command"
	elif [ -n "$status" ]; then
		printf '%s\n\n%s\n\n```bash\n%s\n```' \
			"⚠️ **${repo}/** has uncommitted changes. This repo is separate from the main app (gitignored), so Cursor Changes will not show it." \
			"Run:" \
			"$command"
	elif [ "${unpushed:-0}" -gt 0 ]; then
		printf '%s\n\n%s\n\n```bash\n%s\n```' \
			"⚠️ **${repo}/** has ${unpushed} unpushed commit(s). This repo is separate from the main app (gitignored), so Cursor Changes will not show it." \
			"Run:" \
			"cd ${repo} && git push origin main"
	else
		echo "${repo}/ repo is clean (no uncommitted changes, nothing unpushed on main)."
	fi
}

collect_nested_git_state() {
	local repo="$1"
	if [ ! -d "${repo}/.git" ]; then
		return 1
	fi

	(
		cd "$repo"
		STATUS=$(git status --porcelain)
		UNPUSHED=0
		if git rev-parse --verify origin/main >/dev/null 2>&1; then
			UNPUSHED=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
		fi
		printf '%s\n%s' "$STATUS" "$UNPUSHED"
	)
}

report_repo() {
	local repo="$1"
	STATE=$(collect_nested_git_state "$repo") || {
		echo "${repo}/ is not a git repository."
		return
	}
	STATUS=$(echo "$STATE" | head -n 1)
	UNPUSHED=$(echo "$STATE" | tail -n 1)
	build_repo_status_message "$repo" "$STATUS" "$UNPUSHED"
}

# Parse args: --report [--repo NAME]
MODE="hook"
FILTER_REPO=""

while [ $# -gt 0 ]; do
	case "$1" in
		--report) MODE="report" ;;
		--repo)
			shift
			FILTER_REPO="${1:-}"
			;;
	esac
	shift
done

repos_to_check() {
	if [ -n "$FILTER_REPO" ]; then
		echo "$FILTER_REPO"
	elif [ "$MODE" = "report" ]; then
		echo "$NESTED_REPOS"
	else
		local list=""
		for repo in $NESTED_REPOS; do
			if [ -f ".cursor/.${repo}-dirty" ]; then
				list="$list $repo"
			fi
		done
		echo "$list"
	fi
}

if [ "$MODE" = "report" ]; then
	first=1
	for repo in $(repos_to_check); do
		[ -z "$repo" ] && continue
		if [ "$first" -eq 0 ]; then
			echo ""
			echo "---"
			echo ""
		fi
		report_repo "$repo"
		first=0
	done
	exit 0
fi

# Hook mode: only repos flagged dirty this agent cycle
dirty_repos=""
for repo in $NESTED_REPOS; do
	if [ -f ".cursor/.${repo}-dirty" ]; then
		dirty_repos="$dirty_repos $repo"
		rm -f ".cursor/.${repo}-dirty"
	fi
done

if [ -z "$dirty_repos" ]; then
	echo "{}"
	exit 0
fi

messages=()
for repo in $dirty_repos; do
	STATE=$(collect_nested_git_state "$repo") || continue
	STATUS=$(echo "$STATE" | head -n 1)
	UNPUSHED=$(echo "$STATE" | tail -n 1)

	if [ -z "$STATUS" ] && [ "${UNPUSHED:-0}" -eq 0 ]; then
		continue
	fi

	messages+=("$(build_repo_status_message "$repo" "$STATUS" "$UNPUSHED")")
done

if [ "${#messages[@]}" -eq 0 ]; then
	echo "{}"
	exit 0
fi

combined="${messages[0]}"
local i
for ((i = 1; i < ${#messages[@]}; i++)); do
	combined="${combined}

---

${messages[$i]}"
done

emit_followup "$combined"
