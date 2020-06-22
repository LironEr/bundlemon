import * as yup from 'yup';
import axios, { AxiosError } from 'axios';
import {
  repo,
  branch,
  sha as commitSha,
  pull_request_number as prNumber,
  pull_request_target_branch as baseBranch,
} from 'ci-env';
import { createLogger } from '../../../../common/logger';
import { validateYup } from '../../../utils/validationUtils';
import BaseOutput from '../BaseOutput';
import { ReportOutputName, ReportData } from '../types';
import { EnvVar } from '../../../../common/consts';
import { Status } from 'bundletracker-utils';
import { getDiffSizeText, getDiffPercentText } from '../utils';
import { buildPrCommentBody } from './utils';
import { COMMENT_IDENTIFIER } from './consts';

const logger = createLogger(`${ReportOutputName.githubPR} output:`);

export interface GithubPrOutputOptions {
  statusCheck?: boolean;
  prComment?: boolean;
}

export default class GithubPrOutput extends BaseOutput<ReportOutputName.githubPR> {
  outputName = ReportOutputName.githubPR;

  private axiosClient = axios.create({
    baseURL: `https://api.github.com/repos/${repo}`,
    headers: { Authorization: `token ${process.env[EnvVar.githubToken]}` },
  });

  isEnabled = (): boolean => {
    logger.debug(`branch: "${branch}" base branch: "${baseBranch}" PR number: "${prNumber}"`);

    // Enabled only for PRs
    return !!(branch && baseBranch && prNumber);
  };

  areOptionsValid = async (): Promise<boolean> => {
    const schema = yup
      .object()
      .required()
      .shape<GithubPrOutputOptions>({
        statusCheck: yup.boolean().optional().default(true),
        prComment: yup.boolean().optional().default(false),
      });

    const isValid = validateYup(schema, this.options, `${ReportOutputName.githubPR} output`);

    if (!isValid) {
      return false;
    }

    this.options = schema.cast(this.options);

    logger.debug(`options\n${JSON.stringify(this.options, null, 2)}`);

    return true;
  };

  generate = async (reportData: ReportData): Promise<void> => {
    if (!repo) {
      logger.warn('Missing "CI_REPO_OWNER" & "CI_REPO_NAME" env var');
      return;
    }

    if (!process.env[EnvVar.githubToken]) {
      logger.warn(`Missing "${EnvVar.githubToken}" env var`);
      return;
    }

    if (this.options.statusCheck) {
      if (!commitSha) {
        logger.warn('Missing "CI_COMMIT_SHA" env var');
      } else {
        await this.postStatusCheck(reportData);
      }
    }

    if (this.options.prComment) {
      if (!prNumber) {
        logger.warn('Missing "CI_MERGE_REQUEST_ID" env var');
      } else {
        await this.postPrComment(reportData);
      }
    }
  };

  private postStatusCheck = async (reportData: ReportData): Promise<void> => {
    logger.info('Post status check');
    logger.debug(`Repo: "${repo}" sha: "${commitSha}"`);

    const { stats, status } = reportData.reportSummary;
    try {
      await this.axiosClient.post(`/statuses/${commitSha}`, {
        state: status === Status.Pass ? 'success' : 'failure',
        target_url: reportData.linkToReport,
        context: 'bundletracker',
        description: `Total change ${getDiffSizeText(stats.diff.bytes)} ${
          stats.diff.percent !== Infinity ? getDiffPercentText(stats.diff.percent) : ''
        }`,
      });
    } catch (err) {
      this.logGithubError(err, 'Post PR status:');
    }
  };

  private postPrComment = async (reportData: ReportData): Promise<void> => {
    logger.info('Post comment');
    logger.debug(`Repo: "${repo}" PR: "${prNumber}"`);

    try {
      const comments = await this.axiosClient.get(`/issues/${prNumber}/comments`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingComment = comments.data.find((comment: any) => comment?.body?.startsWith(COMMENT_IDENTIFIER));

      const body = buildPrCommentBody(reportData);

      if (existingComment?.id) {
        logger.debug('Replace existing comment');
        await this.axiosClient.patch(`/issues/${prNumber}/comments/${existingComment.id}`, {
          body,
        });
      } else {
        logger.debug('Post new comment');
        await this.axiosClient.post(`/issues/${prNumber}/comments`, {
          body,
        });
      }
    } catch (err) {
      this.logGithubError(err, 'Post PR comment:');
    }
  };

  private logGithubError = (err: Error | AxiosError, prefix: string): void => {
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
  };
}
