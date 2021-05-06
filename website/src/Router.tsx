import { BrowserRouter, Switch, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateProjectPage from './pages/CreateProjectPage';

const Router = () => (
  <BrowserRouter>
    <Switch>
      <Route path="/create-project" component={CreateProjectPage} />
      <Route path="/" component={HomePage} />
    </Switch>
  </BrowserRouter>
);

export default Router;
