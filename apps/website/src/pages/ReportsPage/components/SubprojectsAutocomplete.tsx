import { Autocomplete, TextField } from '@mui/material';
import { useQuery } from 'react-query';
import { getSubprojects } from '@/services/bundlemonService';
import FetchError from '@/services/FetchError';
import { observer } from 'mobx-react-lite';

interface SubprojectsAutocompleteProps {
  projectId: string;
  value?: string;
  setValue: (v: string | undefined) => void;
}

const SubprojectsAutocomplete = observer(({ projectId, value, setValue }: SubprojectsAutocompleteProps) => {
  const { isLoading, data: subProjects } = useQuery<string[], FetchError>(['projects', projectId, 'subprojects'], () =>
    getSubprojects(projectId)
  );

  return (
    <Autocomplete
      options={subProjects || []}
      loading={isLoading}
      autoHighlight
      renderInput={(params: any) => <TextField {...params} label="Subproject" placeholder="Filter by subproject" />}
      value={value}
      onChange={(_e, newValue) => {
        setValue(newValue || undefined);
      }}
      loadingText="Loading..."
    />
  );
});

export default SubprojectsAutocomplete;
