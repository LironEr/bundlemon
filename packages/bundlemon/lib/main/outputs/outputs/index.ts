/* istanbul ignore file */
import consoleOutput from './console';
import githubOutput from './github';
import jsonOutput from './json';
import customOutput from './custom';

import type { Output } from '../types';

const outputs: Output[] = [consoleOutput, githubOutput, jsonOutput, customOutput];

export const getAllOutputs = (): Output[] => outputs;
