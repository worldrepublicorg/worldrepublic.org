#!/bin/bash
# Check if org is a git repo and has changes
if [ -d "org/.git" ]; then
  CHANGES=$(cd org && git status --short)
  if [ -n "$CHANGES" ]; then
    echo "{ \"followup_message\": \"⚠️ You have uncommitted changes in your private 'org/' folder. Don't forget to push them to keep your notes safe!\" }"
  else
    echo "{}"
  fi
else
  echo "{}"
fi
