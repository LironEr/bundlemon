import { CommitRecord } from 'bundlemon-utils';
import { makeAutoObservable } from 'mobx';
import { PathRecord } from '../types';
import { stringToColor } from './utils';

class ReportsStore {
  commitRecords: CommitRecord[] = [];
  type: 'files' | 'groups' = 'files';
  pathRecords: PathRecord[] = [];

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
      this.pathRecords = [];
      return;
    }

    const recordsByPath: Record<string, PathRecord> = {};

    this.commitRecords.forEach((r) => {
      (this.type === 'files' ? r.files : r.groups).forEach((f) => {
        if (!recordsByPath[f.path]) {
          recordsByPath[f.path] = {
            color: stringToColor(f.path),
            path: f.path,
            minSize: f.size,
            maxSize: f.size,
            isSelected: true,
          };
        } else {
          recordsByPath[f.path].minSize = Math.min(recordsByPath[f.path].minSize, f.size);
          recordsByPath[f.path].maxSize = Math.max(recordsByPath[f.path].maxSize, f.size);
        }
      });
    });

    const latestReport = this.commitRecords[this.commitRecords.length - 1];

    (this.type === 'files' ? latestReport.files : latestReport.groups).forEach((f) => {
      if (recordsByPath[f.path]) {
        recordsByPath[f.path].latestSize = f.size;
        recordsByPath[f.path].friendlyName = f.friendlyName;
      }
    });

    this.pathRecords = Object.values(recordsByPath);
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
}

export default ReportsStore;
