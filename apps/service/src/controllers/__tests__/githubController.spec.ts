import { githubOutputController } from '../githubController';
import { getProject } from '../../framework/mongo/projects';
import { getCommitRecordWithBase } from '../../framework/mongo/commitRecords';

jest.mock('../../framework/mongo/projects');
jest.mock('../../framework/mongo/commitRecords');
jest.mock('../../framework/github');
jest.mock('../utils/githubOutputs');

const createReply = () => {
  const res = { send: jest.fn(), status: jest.fn(), log: { warn: jest.fn(), info: jest.fn() } };
  res.status.mockReturnValue(res);

  return res;
};

const createRequest = (output: Record<string, boolean>) =>
  ({
    params: { projectId: 'project-id', commitRecordId: 'record-id' },
    body: {
      git: { owner: 'owner', repo: 'repo', commitSha: 'sha' },
      auth: { runId: '1' },
      output,
    },
    log: { warn: jest.fn(), info: jest.fn(), error: jest.fn() },
  }) as any;

describe('githubOutputController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('no output flag is true -> return {} without touching DB or GitHub', async () => {
    const res = createReply();

    await githubOutputController.call(
      undefined as any,
      createRequest({ checkRun: false, commitStatus: false, prComment: false }),
      res as any
    );

    expect(res.send).toHaveBeenCalledWith({});
    expect(res.status).not.toHaveBeenCalled();
    expect(getProject).not.toHaveBeenCalled();
    expect(getCommitRecordWithBase).not.toHaveBeenCalled();
  });

  test('at least one output flag is true -> continue processing', async () => {
    const res = createReply();
    jest.mocked(getProject).mockResolvedValue(undefined);

    await githubOutputController.call(
      undefined as any,
      createRequest({ checkRun: false, commitStatus: true, prComment: false }),
      res as any
    );

    expect(getProject).toHaveBeenCalledWith('project-id');
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
