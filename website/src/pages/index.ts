import { lazy } from 'react';

export { default as HomePage } from './HomePage';
export const CreateProjectPage = lazy(() => import(/* webpackChunkName: "CreateProjectPage" */ './CreateProjectPage'));
