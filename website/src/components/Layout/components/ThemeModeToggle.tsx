import { useContext } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { ThemeContext } from '@/components/ThemeProvider';

const ThemeModeToggle = () => {
  const { isDarkMode, setDarkMode } = useContext(ThemeContext);

  return (
    <Tooltip title={isDarkMode ? 'Turn on the light' : 'Turn off the light'}>
      <IconButton
        color="default"
        disableTouchRipple
        onClick={() => {
          setDarkMode(!isDarkMode);
        }}
      >
        {isDarkMode ? <LightModeOutlined fontSize="medium" /> : <DarkModeOutlined fontSize="medium" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeModeToggle;
