import * as yup from 'yup';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Report, Status } from 'bundlemon-utils';
import { owner, repo, branch, commitSha, prNumber, targetBranch } from '../../../utils/ci';
import { createLogger } from '../../../../common/logger';
import { validateYup } from '../../../utils/validationUtils';
import { EnvVar } from '../../../../common/consts';
import { buildPrCommentBody, getStatusCheckDescription } from './utils';
import { COMMENT_IDENTIFIER } from './consts';
import type { Output } from '../../types';

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

async function postStatusCheck(axiosClient: AxiosInstance, report: Report): Promise<void> {
  logger.info('Post status check');
  logger.debug(`Owner: "${owner}" Repo: "${repo}" sha: "${commitSha}"`);

  const {
    status,
    metadata: { linkToReport },
  } = report;

  const payload = {
    state: status === Status.Pass ? 'success' : 'failure',
    target_url: linkToReport,
    context: 'BundleMon',
    description: getStatusCheckDescription(report),
  };

  logger.debug(`Payload\n${JSON.stringify(payload, null, 2)}`);

  try {
    await axiosClient.post(`/statuses/${commitSha}`, payload);

    logger.info('Successfully posted status check');
  } catch (err) {
    logGithubError(err, 'Post PR status:');
  }
}

async function postPrComment(axiosClient: AxiosInstance, report: Report): Promise<void> {
  logger.info('Post comment');
  logger.debug(`Owner: "${owner}" Repo: "${repo}" PR: "${prNumber}"`);

  try {
    logger.debug(`Fetch existing comments`);
    const comments = await axiosClient.get(`/issues/${prNumber}/comments`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingComment = comments.data.find((comment: any) => comment?.body?.startsWith(COMMENT_IDENTIFIER));

    const body = buildPrCommentBody(report);

    if (existingComment?.id) {
      logger.debug('Replace existing comment');
      await axiosClient.patch(`/issues/comments/${existingComment.id}`, {
        body,
      });
    } else {
      logger.debug('Post new comment');
      await axiosClient.post(`/issues/${prNumber}/comments`, {
        body,
      });
    }

    logger.info('Successfully posted comment');
  } catch (err) {
    logGithubError(err, 'Post PR comment:');
  }
}

function logGithubError(err: Error | AxiosError, prefix: string): void {
  const errLogger = logger.clone(prefix);

  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    switch (axiosError?.response?.status) {
      case 400: {
        errLogger.error('validation failed', axiosError.response.data);
        break;
      }
      case 403: {
        errLogger.error('no permissions');
        break;
      }
      default: {
        errLogger.error(`Github returned ${axiosError?.response?.status}`, axiosError?.response?.data);
      }
    }
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

    const githubToken = process.env[EnvVar.githubToken];

    if (!githubToken) {
      throw new Error(`Missing "${EnvVar.githubToken}" env var`);
    }

    return {
      generate: async (reportData) => {
        const axiosClient = axios.create({
          baseURL: `https://api.github.com/repos/${owner}/${repo}`,
          headers: { Authorization: `token ${githubToken}` },
        });

        if (options.statusCheck) {
          if (!commitSha) {
            logger.error('Missing "CI_COMMIT_SHA" env var');
          } else {
            await postStatusCheck(axiosClient, reportData);
          }
        }

        if (options.prComment) {
          if (!prNumber) {
            logger.error('Missing "CI_PR_NUMBER" env var');
          } else {
            await postPrComment(axiosClient, reportData);
          }
        }

        return;
      },
    };
  },
};

export default output;
