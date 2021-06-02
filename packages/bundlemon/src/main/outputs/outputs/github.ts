import * as yup from 'yup';
import { AxiosError } from 'axios';
import { owner, repo } from '../../utils/ci';
import { createLogger } from '../../../common/logger';
import { validateYup } from '../../utils/validationUtils';
import type { Output } from '../types';
import { serviceClient } from '../../../common/service';
import { ProjectIdentifiers } from '../../types';

const NAME = 'github';

const logger = createLogger(`${NAME} output`);

interface GithubOutputOptions {
  checkRun?: boolean;
  commitStatus?: boolean;
  prComment?: boolean;
}

function validateOptions(options: unknown): GithubOutputOptions | undefined {
  const schema = yup
    .object()
    .required()
    .shape<GithubOutputOptions>({
      checkRun: yup.boolean().optional().default(false),
      commitStatus: yup.boolean().optional().default(true),
      prComment: yup.boolean().optional().default(true),
    });

  return validateYup(schema, options, `${NAME} output`);
}

function logGithubError(prefix: string, err: Error | AxiosError, body: unknown): void {
  const errLogger = logger.clone(prefix);

  if ((err as AxiosError).isAxiosError) {
    const axiosError = err as AxiosError;

    errLogger.error(`Github returned ${axiosError?.response?.status}`);

    try {
      errLogger.error(JSON.stringify(axiosError?.response?.data, null, 2));
    } catch {
      errLogger.error(axiosError?.response?.data);
    }
  } else {
    errLogger.error('Unknown error', err);
  }

  try {
    errLogger.debug('request body:');
    errLogger.debug(JSON.stringify(body, null, 2));
  } catch {
    errLogger.debug(body as string);
  }
}

async function githubRequest(
  { projectId, apiKey }: ProjectIdentifiers,
  what: 'check-run' | 'commit-status' | 'pr-comment',
  body: Record<string, unknown>
) {
  try {
    await serviceClient.post(`projects/${projectId}/outputs/github/${what}`, body, {
      headers: { 'x-api-key': apiKey },
    });

    logger.info(`Successfully created GitHub ${what}`);
  } catch (err) {
    logGithubError(what, err, body);

    throw err;
  }
}

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

    return {
      generate: async (report) => {
        const {
          getProjectIdentifiers,
          gitVars: { commitSha, prNumber },
        } = config;
        logger.debug(`Owner: "${owner}" Repo: "${repo}" sha: "${commitSha}" PR: "${prNumber}"`);

        const projectIdentifiers = getProjectIdentifiers();

        if (normalizedOptions.checkRun) {
          logger.info('Create GitHub check run');

          await githubRequest(projectIdentifiers, 'check-run', {
            git: { owner, repo, commitSha },
            report,
          });
        }

        if (normalizedOptions.commitStatus) {
          logger.info('Post commit status to GitHub');

          await githubRequest(projectIdentifiers, 'commit-status', {
            git: { owner, repo, commitSha },
            report,
          });
        }

        if (normalizedOptions.prComment) {
          if (!prNumber) {
            logger.info('Not a PR - ignore post PR comment');
          } else {
            logger.info('Post PR comment to GitHub');

            await githubRequest(projectIdentifiers, 'pr-comment', {
              git: { owner, repo, prNumber },
              report,
            });
          }
        }
      },
    };
  },
};

export default output;
