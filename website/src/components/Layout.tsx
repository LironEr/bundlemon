import styled from '@emotion/styled';
import { AppBar, Typography } from '@mui/material';
import LogoSVG from '../assets/Logo.svg';

const StyledAppBar = styled(AppBar)`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 64px;
  padding: ${({ theme }) => theme.spacing(1, 3)};

  color: #000;
  background-color: #fff;

  svg: {
    margin-right: ${({ theme }) => theme.spacing(2)};
  }
`;

const MainContainer = styled.main`
  display: flex;
  flex-direction: column;
  min-height: 100%;
  width: 100%;
  padding: ${({ theme }) => theme.spacing(11, 6, 2, 6)};
`;

const Layout: React.FC = ({ children }) => {
  return (
    <>
      <StyledAppBar position="fixed">
        <LogoSVG height="100%" />
        <Typography variant="h6" component="span">
          BundleMon
        </Typography>
      </StyledAppBar>
      <MainContainer>{children || <div />}</MainContainer>
    </>
  );
};

export default Layout;
