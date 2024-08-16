import { useState } from 'react';
import styled from '@emotion/styled';
import { Paper, Button, Typography, TextField, Alert, AlertTitle } from '@mui/material';
import * as bundlemonService from '../services/bundlemonService';

import type { CreateProjectResponse } from 'bundlemon-utils';

const Container = styled(Paper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  padding: ${({ theme }) => theme.spacing(2)};
  min-width: 300px;
  max-width: 700px;
`;

const CreateButton = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const CreateProjectPage = () => {
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
      <Container>
        <Typography variant="h5">Define these environment variables</Typography>
        <Typography variant="caption">BUNDLEMON_PROJECT_ID</Typography>
        <TextField variant="outlined" value={project.projectId} fullWidth onFocus={handleFocus} />
        <br />
        <Typography variant="caption">BUNDLEMON_PROJECT_APIKEY</Typography>
        <TextField variant="outlined" value={project.apiKey} fullWidth onFocus={handleFocus} />
      </Container>
    );
  }

  return (
    <Container>
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
      <CreateButton onClick={handleClick} disabled={isLoading} variant="contained" color="primary">
        Create Project
      </CreateButton>
    </Container>
  );
};

export default CreateProjectPage;
