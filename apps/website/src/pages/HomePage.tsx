import styled from '@emotion/styled';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const Container = styled(Paper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  padding: ${({ theme }) => theme.spacing(6)};
  max-width: 700px;
`;

const HomePage = () => {
  return (
    <Container>
      <Typography variant="body1" component="div">
        BundleMon helps you to monitor your bundle size.
        <p>
          Your goal is to keep your bundle size as small as possible to reduce the amount of time it takes for users to
          load your website/application. This is particularly important for users on low bandwidth connections.
        </p>
        <p>
          BundleMon helps you achieve that by constantly monitoring your bundle size on every commit and alerts you on
          changes.
        </p>
      </Typography>

      <Button variant="contained" color="primary" href="https://github.com/LironEr/bundlemon">
        Full Documentation
      </Button>
    </Container>
  );
};

export default HomePage;
