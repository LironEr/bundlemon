import { BrowserRouter, Switch, Route } from 'react-router-dom';
import { HomePage, CreateProjectPage } from '@/pages';

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route path="/create-project" component={CreateProjectPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </BrowserRouter>
);

export default Router;
