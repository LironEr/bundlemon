import { calcChange } from '../utils';
import { DiffChange } from '../../consts';

describe('diff report utils', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('calcChange', () => {
    test('exists in curr branch, not in base branch -> add', () => {
      const change = calcChange({
        isExistsInBaseBranch: false,
        isExistsInCurrBranch: true,
        diffBytes: 100,
      });

      expect(change).toEqual(DiffChange.Add);
    });

    test('exists in base branch, not in curr branch -> remove', () => {
      const change = calcChange({
        isExistsInBaseBranch: true,
        isExistsInCurrBranch: false,
        diffBytes: -100,
      });

      expect(change).toEqual(DiffChange.Remove);
    });

    test('exists in curr branch and in base branch -> update', () => {
      const change = calcChange({
        isExistsInBaseBranch: true,
        isExistsInCurrBranch: true,
        diffBytes: 100,
      });

      expect(change).toEqual(DiffChange.Update);
    });

    describe('exists both in curr and base branches', () => {
      test('0 bytes diff -> no change', () => {
        const change = calcChange({
          isExistsInBaseBranch: true,
          isExistsInCurrBranch: true,
          diffBytes: 0,
        });

        expect(change).toEqual(DiffChange.NoChange);
      });

      test('diff bytes less than 10 bytes -> no change', () => {
        const change = calcChange({
          isExistsInBaseBranch: true,
          isExistsInCurrBranch: true,
          diffBytes: 9,
        });

        expect(change).toEqual(DiffChange.NoChange);
      });

      test('negative diff bytes less than 10 bytes -> no change', () => {
        const change = calcChange({
          isExistsInBaseBranch: true,
          isExistsInCurrBranch: true,
          diffBytes: -5,
        });

        expect(change).toEqual(DiffChange.NoChange);
      });

      test('diff bytes greater than 10 bytes -> update', () => {
        const change = calcChange({
          isExistsInBaseBranch: true,
          isExistsInCurrBranch: true,
          diffBytes: 50,
        });

        expect(change).toEqual(DiffChange.Update);
      });

      test('negative diff bytes greater than 10 bytes -> update', () => {
        const change = calcChange({
          isExistsInBaseBranch: true,
          isExistsInCurrBranch: true,
          diffBytes: -100,
        });

        expect(change).toEqual(DiffChange.Update);
      });
    });
  });
});
