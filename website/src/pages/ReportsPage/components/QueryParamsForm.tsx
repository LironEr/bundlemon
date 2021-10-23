import { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import {
  Grid,
  Paper,
  FormControl,
  TextField,
  InputLabel,
  Select,
  MenuItem,
  SelectProps,
  TextFieldProps,
} from '@mui/material';
import { CommitRecordsQueryResolution } from '@/consts/commitRecords';
import { GetCommitRecordsQuery } from '@/services/bundlemonService';

const Container = styled(Paper)`
  display: flex;
  max-width: 500px;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(2)};
`;

interface QueryParamsFormProps {
  params: GetCommitRecordsQuery;
  setParams: (params: GetCommitRecordsQuery) => void;
}

const QueryParamsForm = ({ params, setParams }: QueryParamsFormProps) => {
  const { branch, resolution } = params;
  const [branchInput, setBranchInput] = useState(() => params.branch);

  useEffect(() => {
    setBranchInput(branch);
  }, [branch]);

  const handleBranchChange: TextFieldProps['onChange'] = (e) => {
    const branch = e.target.value;

    setBranchInput(branch);
  };

  const setResolution: SelectProps['onChange'] = (e) => {
    const resolution = e.target.value as CommitRecordsQueryResolution;

    setParams({ ...params, resolution });
  };

  const setBranch: TextFieldProps['onBlur'] = (e) => {
    const branch = e.target.value;

    setParams({ ...params, branch });
  };

  return (
    <Container>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <TextField
            value={branchInput}
            onChange={handleBranchChange}
            onBlur={setBranch}
            variant="outlined"
            fullWidth
            label="Branch"
            placeholder="Filter by branch"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl variant="outlined" fullWidth>
            <InputLabel htmlFor="resolution">Resolution</InputLabel>
            <Select
              label="Resolution"
              value={resolution}
              inputProps={{
                name: 'Resolution',
                id: 'resolution',
              }}
              onChange={setResolution}
            >
              {Object.values(CommitRecordsQueryResolution).map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Container>
  );
};

export default QueryParamsForm;
