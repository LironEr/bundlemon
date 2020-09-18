import * as yup from 'yup';
import { AxiosError } from 'axios';
import { owner, repo, branch, commitSha, prNumber, targetBranch } from '../../utils/ci';
import { createLogger } from '../../../common/logger';
import { validateYup } from '../../utils/validationUtils';
import { EnvVar } from '../../../common/consts';
import type { Output } from '../types';
import { serviceClient } from '../../../common/service';

const NAME = 'github-pr';

const logger = createLogger(`${NAME} output:`);

interface GithubPrOutputOptions {
  statusCheck?: boolean;
  prComment?: boolean;
}

function areOptionsValid(options: unknown): options is GithubPrOutputOptions {
  const schema = yup
    .object()
    .required()
    .shape<GithubPrOutputOptions>({
      statusCheck: yup.boolean().optional().default(true),
      prComment: yup.boolean().optional().default(false),
    });

  return validateYup(schema, options, `${NAME} output`);
}

function logGithubError(err: Error | AxiosError, prefix: string): void {
  const errLogger = logger.clone(prefix);

  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    errLogger.error(`Github returned ${axiosError?.response?.status}`, axiosError?.response?.data);
  } else {
    errLogger.error('Unknown error', err);
  }
}

const output: Output = {
  name: NAME,
  create: ({ options }) => {
    if (!areOptionsValid(options)) {
      return undefined;
    }

    logger.debug(`branch: "${branch}" target branch: "${targetBranch}" PR number: "${prNumber}"`);

    // Enable only for PRs
    if (!(branch && targetBranch && prNumber)) {
      return undefined;
    }

    if (!owner || !repo) {
      throw new Error('Setup "CI_REPO_OWNER" & "CI_REPO_NAME" env vars');
    }

    if (options.statusCheck && !commitSha) {
      throw new Error('Missing "CI_COMMIT_SHA" env var');
    }

    if (options.prComment && !prNumber) {
      throw new Error('Missing "CI_PR_NUMBER" env var');
    }

    const githubToken = process.env[EnvVar.githubToken];

    if (!githubToken) {
      throw new Error(`Missing "${EnvVar.githubToken}" env var`);
    }

    return {
      generate: async (report) => {
        logger.debug(`Owner: "${owner}" Repo: "${repo}" sha: "${commitSha}" PR: "${prNumber}"`);

        if (options.statusCheck) {
          logger.info('Post status check to GitHub');

          try {
            await serviceClient.post(
              `github/pr/status`,
              {
                git: { owner, repo, sha: commitSha },
                report,
              },
              { headers: { 'github-token': githubToken } }
            );

            logger.info('Successfully posted status check');
          } catch (err) {
            logGithubError(err, 'Post PR status:');

            throw err;
          }
        }

        if (options.prComment) {
          logger.info('Post comment to GitHub');

          try {
            await serviceClient.post(
              `github/pr/comment`,
              {
                git: { owner, repo, prNumber },
                report,
              },
              { headers: { 'github-token': githubToken } }
            );

            logger.info('Successfully posted comment');
          } catch (err) {
            logGithubError(err, 'Post PR comment:');

            throw err;
          }
        }
      },
    };
  },
};

export default output;
