import { Stack, Tab, Tooltip, TabProps } from '@mui/material';

import FailIcon from '@mui/icons-material/Close';

interface TabTitleProps extends TabProps {
  value: string;
  label: string;
  failsCount: number;
}

const TabTitle = ({ value, label, failsCount, ...tabProps }: TabTitleProps) => {
  return (
    <Tab
      {...tabProps}
      label={
        <Stack direction="row" alignItems="center">
          <span>{label}</span>
          {failsCount > 0 && (
            <Tooltip title={`${failsCount} fails`}>
              <FailIcon color="error" fontSize="small" />
            </Tooltip>
          )}
        </Stack>
      }
      value={value}
    />
  );
};

export default TabTitle;
