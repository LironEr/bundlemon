import { CommitRecord } from 'bundlemon-utils';
import { computed, makeAutoObservable } from 'mobx';
import { PathRecord } from '../types';
import { stringToColor } from './utils';

import type { RowSelectionState, OnChangeFn } from '@tanstack/react-table';

class ReportsStore {
  commitRecords: CommitRecord[] = [];
  type: 'files' | 'groups' = 'files';
  pathRecordsMap = new Map<string, PathRecord>();

  @computed
  get pathRecords() {
    return Array.from(this.pathRecordsMap.values());
  }

  @computed
  get rowSelectionState() {
    const state: RowSelectionState = {};

    this.pathRecords.forEach((r) => {
      state[r.path] = r.isSelected;
    });

    return state;
  }

  constructor() {
    makeAutoObservable(this);
  }

  setCommitRecords = (commitRecords: CommitRecord[]) => {
    this.commitRecords = commitRecords.sort(
      (a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime()
    );

    this.refreshPathReords();
  };

  refreshPathReords = () => {
    if (this.commitRecords.length === 0) {
      this.pathRecordsMap.clear();
      return;
    }

    this.pathRecordsMap.clear();

    this.commitRecords.forEach((r) => {
      (this.type === 'files' ? r.files : r.groups).forEach((f) => {
        if (!this.pathRecordsMap.has(f.path)) {
          this.pathRecordsMap.set(f.path, {
            color: stringToColor(f.path),
            path: f.path,
            minSize: f.size,
            maxSize: f.size,
            isSelected: true,
          });
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const pathRecord = this.pathRecordsMap.get(f.path)!;

        pathRecord.minSize = Math.min(pathRecord.minSize, f.size);
        pathRecord.maxSize = Math.max(pathRecord.maxSize, f.size);

        // Update every time to set the latest friendly name available
        pathRecord.friendlyName = f.friendlyName;
      });
    });

    const latestReport = this.commitRecords[this.commitRecords.length - 1];

    (this.type === 'files' ? latestReport.files : latestReport.groups).forEach((f) => {
      const pathRecord = this.pathRecordsMap.get(f.path);

      if (pathRecord) {
        pathRecord.latestSize = f.size;
      }
    });
  };

  setType = (type: 'files' | 'groups') => {
    this.type = type;

    this.refreshPathReords();
  };

  toggleRowSelection = (index: number) => {
    this.pathRecords[index].isSelected = !this.pathRecords[index].isSelected;
  };

  get isAllSelected() {
    return this.pathRecords.filter((record) => record.isSelected === true).length === this.pathRecords.length;
  }

  toggleAllSelection = () => {
    const newSelectValue = !this.isAllSelected;

    this.pathRecords.forEach((record) => {
      record.isSelected = newSelectValue;
    });
  };

  setRowSelection: OnChangeFn<RowSelectionState> = (updaterOrValue) => {
    const state: RowSelectionState =
      typeof updaterOrValue === 'function' ? updaterOrValue(this.rowSelectionState) : updaterOrValue;

    this.pathRecords.forEach((r) => {
      r.isSelected = state[r.path] || false;
    });
  };
}

export default ReportsStore;
