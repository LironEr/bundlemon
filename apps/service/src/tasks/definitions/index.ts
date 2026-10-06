import { deleteOldRecordsTask } from './deleteOldRecords';
import { deleteStaleBranchesTask } from './deleteStaleBranches';

import type { TaskId } from '@/consts/tasks';
import type { TaskDefinition } from '../types';

export const tasks: TaskDefinition[] = [deleteStaleBranchesTask, deleteOldRecordsTask];

export const getTask = (id: TaskId) => tasks.find((task) => task.id === id);
