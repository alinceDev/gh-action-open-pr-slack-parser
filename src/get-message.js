'use strict';

const slackBlockKit = require('./slack-helpers');
const prefixError = require('./prefix-vendor-error-message');

const getRepoURL = (repoObject) => {
  return `*${slackBlockKit.link(repoObject.full_name, repoObject.html_url)}*`;
};

const parseEmptyPullRequests = (repoObject) => {
  const message = `${getRepoURL(repoObject)} has no open pull requests right now`;
  return slackBlockKit.sectionWithText(message);
};

const parsePullRequests = ({pullRequests, ignoreDraft}) => {
  const [{head: {repo: repoObject}}] = pullRequests;
  const head = `${getRepoURL(repoObject)} has the following PRs open:`;
  const parsePR = pr => {
    if (ignoreDraft === 'false' || ignoreDraft === 'true' && pr.draft === false ) {
      `- ${slackBlockKit.link(pr.title, pr.html_url)} by ${pr.user.login}\n`;
    }
  };
  const body = pullRequests.map(parsePR).join('');

  return slackBlockKit.sectionWithText(`${head}\n${body}`.trim());
};

module.exports = async ({Octokit, owner, repo, ignoreDraft}) => {
  try {
    const {data: pullRequests} = await Octokit.pulls.list({owner, repo, state: 'open'});

    if (!pullRequests.length) {
      const {data: repoObject} = await Octokit.repos.get({owner, repo});
      return parseEmptyPullRequests(repoObject);
    }

    return parsePullRequests({pullRequests, ignoreDraft});
  } catch (error) {
    error.message = prefixError(error, 'GitHub');
    throw error;
  }
};
