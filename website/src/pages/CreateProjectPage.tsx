import { useState } from 'react';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import * as bundlemonService from '../services/bundlemonService';

import type { CreateProjectResponse } from 'bundlemon-utils';

const useStyles = makeStyles((theme) => ({
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    padding: theme.spacing(2),
    minWidth: '300px',
    maxWidth: '500px',
  },
  button: {
    marginTop: theme.spacing(2),
  },
}));

const CreateProjectPage = () => {
  const classes = useStyles();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [project, setProject] = useState<CreateProjectResponse | undefined>(undefined);

  const handleFocus: React.ComponentProps<typeof TextField>['onFocus'] = (event) => event.target.select();

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const res = await bundlemonService.createProject();

      setProject(res);
    } catch (err) {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (project) {
    return (
      <Paper className={classes.paper}>
        <Typography variant="h5">Define these environment variables</Typography>
        <Typography variant="caption">BUNDLEMON_PROJECT_ID</Typography>
        <TextField variant="outlined" value={project.projectId} fullWidth onFocus={handleFocus} />
        <br />
        <Typography variant="caption">BUNDLEMON_PROJECT_APIKEY</Typography>
        <TextField variant="outlined" value={project.apiKey} fullWidth onFocus={handleFocus} />
      </Paper>
    );
  }

  return (
    <Paper className={classes.paper}>
      {isError && (
        <Alert severity="error">
          <AlertTitle>Failed to create project!</AlertTitle>
          Please try again in a few minutes
        </Alert>
      )}
      <Typography variant="body1">
        In order to save history and get differences from your main branches you will need to create a new project and
        setup environment variables.
      </Typography>
      <Button onClick={handleClick} disabled={isLoading} variant="contained" color="primary" className={classes.button}>
        Create Project
      </Button>
    </Paper>
  );
};

export default CreateProjectPage;
