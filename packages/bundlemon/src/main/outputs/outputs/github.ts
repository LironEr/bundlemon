import * as yup from 'yup';
import { getCIVars, owner, repo } from '../../utils/ci';
import { createLogger } from '../../../common/logger';
import { validateYup } from '../../utils/validationUtils';
import { serviceClient } from '../../../common/service';
import { getEnvVar } from '../../utils/utils';

import type { AxiosError } from 'axios';
import type { GithubOutputResponse, GithubOutputTypes } from 'bundlemon-utils';
import type { Output } from '../types';

const NAME = 'github';

const logger = createLogger(`${NAME} output`);

type GithubOutputOptions = Record<GithubOutputTypes, boolean>;

function validateOptions(options: unknown): GithubOutputOptions | undefined {
  const schema: yup.SchemaOf<GithubOutputOptions, GithubOutputOptions> = yup
    .object()
    .required()
    .shape({
      checkRun: yup.boolean().optional().default(false),
      commitStatus: yup.boolean().optional().default(true),
      prComment: yup.boolean().optional().default(true),
    });

  return validateYup(schema, options, `${NAME} output`);
}

function logGithubError(err: Error | AxiosError): void {
  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    logger.error(`Github returned ${axiosError?.response?.status}`);

    try {
      logger.error(JSON.stringify(axiosError?.response?.data, null, 2));
    } catch {
      logger.error(axiosError?.response?.data as string);
    }
  } else {
    logger.error('Unknown error', err);
  }
}

type GitHubOutputAuthParams = { token: string } | { runId: string };

const output: Output = {
  name: NAME,
  create: ({ options, config }) => {
    const normalizedOptions = validateOptions(options);

    if (!normalizedOptions) {
      throw new Error(`validation error in output "${NAME}" options`);
    }

    if (!config.remote) {
      logger.warn('remote flag is OFF, ignore output');
      return undefined;
    }

    if (!owner || !repo) {
      throw new Error('Missing "CI_REPO_OWNER" & "CI_REPO_NAME" env vars');
    }

    let authParams: GitHubOutputAuthParams;

    const ciVars = getCIVars();
    const githubToken = getEnvVar('BUNDLEMON_GITHUB_TOKEN');

    if (githubToken) {
      authParams = { token: githubToken };
    } else if (ciVars.provider == 'github' && ciVars.buildId) {
      authParams = { runId: ciVars.buildId };
    } else {
      throw new Error('Missing GitHub actions run id or GitHub token');
    }

    return {
      generate: async (report) => {
        const {
          projectId,
          gitVars: { commitSha, prNumber },
        } = config;
        if (!report.metadata.record?.id) {
          throw new Error('missing commit record id');
        }

        logger.debug(`Owner: "${owner}" Repo: "${repo}" sha: "${commitSha}" PR: "${prNumber}"`);

        const payload = {
          git: { owner, repo, commitSha, prNumber },
          auth: authParams,
          output: normalizedOptions,
        };

        try {
          const { data: response } = await serviceClient.post<GithubOutputResponse>(
            `projects/${projectId}/commit-records/${report.metadata.record.id}/outputs/github`,
            payload
          );

          let didFail = false;

          for (const [type, result] of Object.entries(response)) {
            let logFunc = logger.info;

            if (result.result === 'failure') {
              logFunc = logger.error;
              didFail = true;
            }

            logFunc(`Create GitHub "${type}": ${result.result} - ${result.message}`);
          }

          if (didFail) {
            throw new Error('One or more GitHub outputs failed');
          }
        } catch (err) {
          logGithubError(err as Error);

          throw err;
        }
      },
    };
  },
};

export default output;
