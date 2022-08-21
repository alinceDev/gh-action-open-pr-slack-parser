'use strict';

const GitHubCore = require('@actions/core');
const {context: GitHubContext, GitHub: GitHubClient} = require('@actions/github');
const {WebClient: SlackWebClient} = require('@slack/web-api');

const getMessage = require('./src/get-message');
const postMessage = require('./src/post-message');
const prefixError = require('./src/prefix-vendor-error-message');

module.exports.run = async () => {
  let message;

  try {
    const gitHubToken = GitHubCore.getInput('github-token') || process.env.GITHUB_TOKEN;
    const Octokit = new GitHubClient(gitHubToken);
    const {owner, repo} = GitHubContext.repo;
    const ignoreDraft = GitHubCore.getInput('ignore-draft') || process.env.IGNORE_DRAFT;
    message = await getMessage({Octokit, owner, repo, ignoreDraft});
    GitHubCore.info('Message built');
  } catch (error) {
    GitHubCore.setFailed(prefixError(error, 'GitHub'));
    return;
  }
  if (message !== null) {
    try {
      const slackToken = GitHubCore.getInput('slackbot-token') || process.env.SLACK_TOKEN;
      const Slack = new SlackWebClient(slackToken);
      const slackConversationId = GitHubCore.getInput('slack-conversation-id') || process.env.SLACK_CONVERSATION_ID;
      await postMessage({Slack, channel: slackConversationId, blocks: message});

      GitHubCore.info('Message posted');
    } catch (error) {
      GitHubCore.setFailed(prefixError(error, 'Slack'));
    }
  } else {
    GitHubCore.info('No Message');
  }
};

if (!process.argv.join('').includes('jasmine')) {
  module.exports.run();
}
