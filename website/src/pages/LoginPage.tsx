import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router';
import { useQueryParams } from '@/hooks';
import { Paper, Alert } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { login } from '@/services/bundlemonService';
import GitHubIcon from '@mui/icons-material/GitHub';
import { GITHUB_APP_ID } from '@/consts/config';
import { userStore } from '@/stores/UserStore';
import { observer } from 'mobx-react-lite';

const Container = styled(Paper)`
  display: flex;
  flex-direction: column;
  align-items: center;
  align-self: center;
  padding: ${({ theme }) => theme.spacing(6)};
  max-width: 700px;
`;

const LoginPage = observer(() => {
  const query = useQueryParams();

  const navigate = useNavigate();
  const code = query.get('code');
  const from = query.get('from') || '';

  const [isLoading, setIsLoading] = useState(() => !!code);

  useEffect(() => {
    if (code) {
      (async () => {
        const cachedFrom = from;

        // remove query params from url
        navigate('', {
          replace: true,
        });

        await login(code);
        userStore.init();
        setIsLoading(false);

        if (cachedFrom) {
          navigate(cachedFrom, { replace: true });
        }
      })();
    }
  }, [navigate, code, from]);

  const redirectUri = encodeURIComponent(
    `${window.location.href.split('?')[0]}?provider=github${from ? `&from=${from}` : ''}`
  );

  return (
    <Container>
      {userStore.user ? (
        <Alert severity="warning">You are already logged in</Alert>
      ) : (
        <LoadingButton
          variant="contained"
          startIcon={<GitHubIcon />}
          href={`https://github.com/login/oauth/authorize?client_id=${GITHUB_APP_ID}&redirect_uri=${redirectUri}`}
          loading={isLoading}
          sx={{ width: '100%' }}
        >
          Login with GitHub
        </LoadingButton>
      )}
    </Container>
  );
});

export default LoginPage;
