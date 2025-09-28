#!/bin/bash



# Optional: Git user setup
git config user.name "OmashV"
git config user.email "vidurangaomash@gmail.com"

# Initial file
touch search.txt
echo "Search Agent Log" > search.txt
git add search.txt
git commit -m "Initialize search agent tracking"

# Define commit messages
messages=(
  "Setup frontend project"
  "Add search agent module"
  "Build login and signup forms"
  "Connect API to frontend"
  "Add keyword search"
  "Style homepage and dashboard"
  "Fix search query bug"
  "Make site responsive"
  "Add filters to search"
  "Improve form validation"
  "Link search with frontend"
  "Add profile page"
  "Cache search results"
  "Add search bar to UI"
  "Secure search API"
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
    echo "$commit_msg - $(date)" >> search.txt
    git add search.txt

    # Make the commit with custom date
    GIT_COMMITTER_DATE="$commit_date" git commit --date="$commit_date" -m "$commit_msg"
  done
done

# Optional: Push to GitHub
# git remote add origin https://github.com/your-username/your-repo.git
# git branch -M main
# git push -u origin main
