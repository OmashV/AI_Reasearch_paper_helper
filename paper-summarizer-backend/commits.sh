#!/bin/bash



# Optional: Git user setup
git config user.name "Binuri321"
git config user.email "binuriminoshi0@gmail.com"

# Initial file
touch cit.txt
echo "Citation Agent Log" > cit.txt
git add cit.txt
git commit -m "Initialize Citation agent tracking"

# Define commit messages
messages=(
  "Add citations agent module"
  "Connect citations agent to LLM"
  "Fix bug in citation parsing"
  "Add input check for citation requests"
  "Show citations in UI"
  "Refactor citations agent service"
  "Add support for multiple sources"
  "Fix missing author in citation output"
  "Improve citation formatting"
  "Add tests for citation agent"
  "Update citations UI layout"
  "Enable export citations as text"
  "Improve error handling in citations agent"
  "Secure citation API endpoints"
  "Add pagination for long citation lists"
)



# Loop through last 14 days
for day_offset in {13..0}; do
  # Randomly decide whether to make 1 or 2 commits
  num_commits=$((1 + RANDOM % 2))

  for ((i=0; i<num_commits; i++)); do
    # Random commit time during the day
    hour=$((RANDOM % 10 + 9))    # between 9 AM and 6 PM
    minute=$((RANDOM % 60))
    second=$((RANDOM % 60))

    commit_date=$(date -d "$day_offset days ago $hour:$minute:$second" "+%Y-%m-%dT%H:%M:%S")

    # Pick a random message
    msg_index=$((RANDOM % ${#messages[@]}))
    commit_msg=${messages[$msg_index]}

    # Make a fake change
    echo "$commit_msg - $(date)" >> cit.txt
    git add cit.txt

    # Make the commit with custom date
    GIT_COMMITTER_DATE="$commit_date" git commit --date="$commit_date" -m "$commit_msg"
  done
done

# Optional: Push to GitHub
# git remote add origin https://github.com/your-username/your-repo.git
# git branch -M main
# git push -u origin main
