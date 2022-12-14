# A GitHub action reporting open PR and branch protection state

## Usage

```yaml
name: Github reporting

on:
  schedule:
    - cron: "0 9 * 1-5 *"

jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Get PR list
        uses: alinceDev/gh-action-reporting-slack@main
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          slackbot-token: YOUR_SLACKBOT_TOKEN
          slack-conversation-id: YOUR_CHANNEL_ID
          ingore-draft: true

```
