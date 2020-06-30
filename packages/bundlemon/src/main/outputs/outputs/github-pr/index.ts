import * as yup from 'yup';
import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  repo,
  branch,
  sha as commitSha,
  pull_request_number as prNumber,
  pull_request_target_branch as baseBranch,
} from 'ci-env';
import { createLogger } from '../../../../common/logger';
import { validateYup } from '../../../utils/validationUtils';
import { EnvVar } from '../../../../common/consts';
import { Status } from 'bundlemon-utils';
import { getDiffSizeText, getDiffPercentText } from '../../utils';
import { buildPrCommentBody } from './utils';
import { COMMENT_IDENTIFIER } from './consts';
import type { ReportData } from '../../../types';
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

async function postStatusCheck(axiosClient: AxiosInstance, reportData: ReportData): Promise<void> {
  logger.info('Post status check');
  logger.debug(`Repo: "${repo}" sha: "${commitSha}"`);

  const { stats, status } = reportData.reportSummary;
  try {
    await axiosClient.post(`/statuses/${commitSha}`, {
      state: status === Status.Pass ? 'success' : 'failure',
      target_url: reportData.linkToReport,
      context: 'bundlemon',
      description: `Total change ${getDiffSizeText(stats.diff.bytes)} ${
        stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
      }`,
    });
  } catch (err) {
    logGithubError(err, 'Post PR status:');
  }
}

async function postPrComment(axiosClient: AxiosInstance, reportData: ReportData): Promise<void> {
  logger.info('Post comment');
  logger.debug(`Repo: "${repo}" PR: "${prNumber}"`);

  try {
    const comments = await axiosClient.get(`/issues/${prNumber}/comments`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingComment = comments.data.find((comment: any) => comment?.body?.startsWith(COMMENT_IDENTIFIER));

    const body = buildPrCommentBody(reportData);

    if (existingComment?.id) {
      logger.debug('Replace existing comment');
      await axiosClient.patch(`/issues/${prNumber}/comments/${existingComment.id}`, {
        body,
      });
    } else {
      logger.debug('Post new comment');
      await axiosClient.post(`/issues/${prNumber}/comments`, {
        body,
      });
    }
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

    logger.debug(`branch: "${branch}" base branch: "${baseBranch}" PR number: "${prNumber}"`);

    // Enabled only for PRs
    if (!(branch && baseBranch && prNumber)) {
      return undefined;
    }

    if (!repo) {
      throw new Error('Missing "CI_REPO_OWNER" & "CI_REPO_NAME" env var');
    }

    const githubToken = process.env[EnvVar.githubToken];

    if (!githubToken) {
      throw new Error(`Missing "${EnvVar.githubToken}" env var`);
    }

    return {
      generate: async (reportData) => {
        const axiosClient = axios.create({
          baseURL: `https://api.github.com/repos/${repo}`,
          headers: { Authorization: `token ${githubToken}` },
        });

        if (options.statusCheck) {
          if (!commitSha) {
            logger.warn('Missing "CI_COMMIT_SHA" env var');
          } else {
            await postStatusCheck(axiosClient, reportData);
          }
        }

        if (options.prComment) {
          if (!prNumber) {
            logger.warn('Missing "CI_MERGE_REQUEST_ID" env var');
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
