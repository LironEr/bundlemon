import { lazy } from 'react';

export { default as HomePage } from './HomePage';
export const CreateProjectPage = lazy(() => import('./CreateProjectPage'));
export const ReportPage = lazy(() => import('./ReportPage/ReportPage'));
export const ReportsPage = lazy(() => import('./ReportsPage/ReportsPage'));
export const LoginPage = lazy(() => import('./LoginPage'));
