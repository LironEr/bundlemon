import * as yup from 'yup';
import { GithubOutputResponse, GithubOutputTypes, Report, Status } from 'bundlemon-utils';
import { getCIVars, owner, repo } from '../../utils/ci';
import { createLogger } from '../../../common/logger';
import { validateYup } from '../../utils/validationUtils';
import { serviceClient } from '../../../common/service';
import { getEnvVar } from '../../utils/utils';

import type { AxiosError } from 'axios';
import type { Output } from '../types';

const NAME = 'github';
const logger = createLogger(`${NAME} output`);

export enum GithubOutputPostOption {
  Always = 'always',
  OnFailure = 'on-failure',
  Off = 'off',
}

export type GithubOutputOptions = Record<GithubOutputTypes, boolean | GithubOutputPostOption>;

function createGithubOutputPostOptionSchema(defaultValue: boolean) {
  return yup.lazy((value) =>
    (typeof value === 'string'
      ? yup.mixed<GithubOutputPostOption>().optional().oneOf(Object.values(GithubOutputPostOption)).default(true)
      : yup.boolean()
    )
      .optional()
      .default(defaultValue)
  );
}

export function validateOptions(options: unknown): GithubOutputOptions | undefined {
  const schema: yup.SchemaOf<GithubOutputOptions, GithubOutputOptions> = yup
    .object()
    .required()
    .shape({
      checkRun: createGithubOutputPostOptionSchema(false),
      commitStatus: createGithubOutputPostOptionSchema(true),
      prComment: createGithubOutputPostOptionSchema(true),
    })
    .noUnknown(true);

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
          output: {
            checkRun: shouldPostOutput(normalizedOptions.checkRun, report),
            commitStatus: shouldPostOutput(normalizedOptions.commitStatus, report),
            prComment: shouldPostOutput(normalizedOptions.prComment, report),
          },
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

function shouldPostOutput(option: GithubOutputPostOption | boolean | undefined, report: Report): boolean {
  return (
    option === true ||
    option === GithubOutputPostOption.Always ||
    (option === GithubOutputPostOption.OnFailure && report.status === Status.Fail)
  );
}
