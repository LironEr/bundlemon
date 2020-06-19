import * as bytes from 'bytes';
import { cosmiconfig } from 'cosmiconfig';
// @ts-expect-error
import { branch, sha as commitSha, pull_request_target_branch as baseBranch } from 'ci-env';
import bundletracker from '../main';
import { Config } from '../main/types';
import logger from '../common/logger';

const explorer = cosmiconfig('bundletracker');

function printSign(num: number) {
  return num > 0 ? '+' : '';
}

function printDiffSize(size: number) {
  return `${printSign(size)}${bytes(size)}`;
}

function printDiffPercent(percent: number | null) {
  if (percent === null) {
    return '';
  }

  return `${printSign(percent)}${percent}%`;
}

export default async (): Promise<void> => {
  try {
    const cosmiconfigResult = await explorer.search();

    if (!cosmiconfigResult || cosmiconfigResult.isEmpty) {
      logger.error('Cant find config or the config file is empty');
      process.exit(1);
    }

    const config: Config = cosmiconfigResult.config;

    const response = await bundletracker(
      config,
      { branch, commitSha, baseBranch },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      { projectId: process.env.BUNDLETRACKER_PROJECT_ID!, apiKey: process.env.BUNDLETRACKER_APIKEY! }
    );

    if (!response) {
      logger.error('Failed to create report');
      process.exit(1);
    }

    const { url, report } = response;

    report.files.forEach((f) => {
      logger.info(`${f.path}: ${bytes(f.size)} (${printDiffSize(f.diff.bytes)} ${printDiffPercent(f.diff.percent)})`);
    });

    logger.log(
      `Total change ${printDiffSize(report.stats.diff.bytes)} (${printDiffPercent(report.stats.diff.percent)})`
    );

    logger.log(`View report: ${url}`);

    process.exit(0);
  } catch (err) {
    logger.error('Unhandled error', err);
    process.exit(1);
  }
};
