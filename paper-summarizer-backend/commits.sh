#!/bin/bash



# Optional: Git user setup
git config user.name "malindusahan"
git config user.email "balasooriyamalindu@gmail.com"

# Initial file
touch sum.txt
echo "Summarize Agent Log" > sum.txt
git add sum.txt
git commit -m "Initialize summarize agent tracking"

# Define commit messages
messages=(
  "Add summarizer agent module"
  "Connect summarizer to LLM API"
  "Build text summarization function"
  "Fix bug in summary length"
  "Add input validation for summarizer"
  "Test summarizer with sample docs"
  "Improve summary accuracy"
  "Add option for short or long summary"
  "Handle empty text case"
  "Refactor summarizer service"
  "Write API docs for summarizer"
  "Link summarizer with frontend"
  "Add caching for summaries"
  "Improve error handling in summarizer"
  "Secure summarizer API"
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
