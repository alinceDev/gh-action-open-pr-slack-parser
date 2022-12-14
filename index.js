import GitHubCore from '@actions/core';
import github from '@actions/github';
import {WebClient as SlackWebClient} from '@slack/web-api';

import {getMessage} from './src/get-message.js';
import {postMessage} from './src/post-message.js';
import prefixError from './src/prefix-vendor-error-message.js';

async function run() {
  let message;

  try {
    const gitHubToken = GitHubCore.getInput('github-token') || process.env.GITHUB_TOKEN;
    const Octokit = github.getOctokit(gitHubToken);
    const context = github.context;

    message = await getMessage({Octokit, context});

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
}

run()