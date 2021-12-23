import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage, CreateProjectPage, ReportPage, ReportsPage } from '@/pages';

const Router = () => (
  <BrowserRouter>
    <Routes>
      <Route path="create-project" element={<CreateProjectPage />} />
      <Route path="projects/:projectId">
        <Route path="reports">
          <Route index element={<ReportsPage />} />
          <Route path=":reportId" element={<ReportPage />} />
        </Route>
      </Route>
      <Route path="/" element={<HomePage />} />
    </Routes>
  </BrowserRouter>
);

export default Router;
