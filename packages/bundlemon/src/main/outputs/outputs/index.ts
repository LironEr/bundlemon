/* istanbul ignore file */
import consoleOutput from './console';
import githubOutput from './github';
import jsonOutput from './json';

import type { Output } from '../types';

const outputs: Output[] = [consoleOutput, githubOutput, jsonOutput];

export const getAllOutputs = (): Output[] => outputs;
