import { lazy } from 'react';

export { default as HomePage } from './HomePage';
export const CreateProjectPage = lazy(() => import(/* webpackChunkName: "CreateProjectPage" */ './CreateProjectPage'));
export const ReportPage = lazy(() => import(/* webpackChunkName: "ReportPage" */ './ReportPage'));
export const ReportsPage = lazy(() => import(/* webpackChunkName: "ReportsPage" */ './ReportsPage'));
