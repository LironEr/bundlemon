import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { HomePage, CreateProjectPage, ReportPage } from '@/pages';

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/create-project" component={CreateProjectPage} />
      <Route exact path="/projects/:projectId/reports/:reportId" component={ReportPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </BrowserRouter>
);

export default Router;
