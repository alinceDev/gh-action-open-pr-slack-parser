import {SlackBlockKit} from './slack-helpers.js';
import prefixError from './prefix-vendor-error-message.js';

const getRepoURL = (repoObject) => {
  return `*${SlackBlockKit.link(repoObject.full_name, repoObject.html_url)}*`;
};

const parsePullRequests = ({pullRequests}) => {
  const [{head: {repo: repoObject}}] = pullRequests;
  const head = `${getRepoURL(repoObject)} has the following PRs open:`;
  const parsePR = pr => {
    if (pr.draft === false) {
      return `- ${SlackBlockKit.link(pr.title, pr.html_url)} | by ${pr.user.login} | Review: \`${pr.requiredReviews}\`\n`;
    }
  };

  const body = pullRequests.map(parsePR).join('');

  if (body !== null && body !== '') {
    return `${head}\n${body}`.trim();
  }

  return null;
};

const getRequiredReview = async ({Octokit, context, pullRequests}) => {
  for (const pr in pullRequests) {
    const pull_number = pullRequests[pr].number;
    const {data} = await Octokit.rest.pulls.listReviews(
        {...context.repo, pull_number}
    );
    let approved = 0;

    for (const review in data) {
      if (data[review].state === 'APPROVED') {
        approved += 1;
      }
    }

    pullRequests[pr].requiredReviews = approved + '/2'
  }

  return pullRequests;
};

const checkBranches = (branches) => {
  let message = '';
  for (const key in branches) {
    if (['release', 'develop', 'master'].includes(branches[key].name)) {
      if (branches[key].name === 'release') {
        message = 'ℹ️ Branch release detected.';
      }
      if (branches[key].protected === false) {
        message = message + `⚠️ Branch ${branches[key].name} not protected.\n`;
      }
    }
  }

  return message;
}

export async function getMessage({Octokit, context}) {
  try {
    let {data: pullRequests} = await Octokit.rest.pulls.list({...context.repo, state: 'open', draft: false});
    if (!pullRequests.length) {
      return null;
    }
    pullRequests = await getRequiredReview({Octokit, context, pullRequests});
    const { data: branches } = await Octokit.rest.repos.listBranches({...context.repo});
    let message = parsePullRequests({pullRequests});
    if (message !== null) {
      const branchesMessages = checkBranches(branches)

      if (branchesMessages !== '') {
        message = message + '\n\n' + branchesMessages;
      }

      return SlackBlockKit.sectionWithText(message);
    }

    return null;
  } catch (error) {
    error.message = prefixError(error, 'GitHub');
    throw error;
  }
}
