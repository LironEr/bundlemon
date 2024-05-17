import styled from '@emotion/styled';
import { observer } from 'mobx-react-lite';
import { AppBar, Box, IconButton, Stack, Tooltip } from '@mui/material';
import LogoSVG from '@/assets/logo.svg';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkNoStyles from '@/components/LinkNoStyles';
import ThemeModeToggle from './components/ThemeModeToggle';
import UserSection from './components/UserSection';

const StyledAppBar = styled(AppBar)`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 64px;
  padding: ${({ theme }) => theme.spacing(1, 3)};

  color: ${({ theme }) => theme.palette.text.primary};
  background-color: ${({ theme }) => theme.palette.background.default};

  svg: {
    margin-right: ${({ theme }) => theme.spacing(2)};
  }
`;

const LogoText = styled(LinkNoStyles)`
  font-weight: 500;
  font-size: 1.25rem;
`;

const MainContainer = styled.main`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(11, 6, 2, 6)};
  background-color: ${({ theme }) => theme.palette.background.default};
`;

const Layout = observer(({ children }: React.PropsWithChildren) => {
  return (
    <>
      <StyledAppBar position="fixed">
        <LogoSVG height="100%" />
        <LogoText to="/">BundleMon</LogoText>
        <Box sx={{ ml: 'auto' }} />
        <Stack direction="row" spacing={1}>
          <Tooltip title="GitHub repository" enterDelay={300}>
            <IconButton component="a" color="default" href="https://github.com/LironEr/bundlemon" target="_blank">
              <GitHubIcon fontSize="medium" />
            </IconButton>
          </Tooltip>
          <ThemeModeToggle />
          <UserSection />
        </Stack>
      </StyledAppBar>
      <MainContainer>{children || <div />}</MainContainer>
    </>
  );
});

export default Layout;
