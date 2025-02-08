import { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { useNavigate } from 'react-router';
import { useQueryParams } from '@/hooks';
import { Paper, Alert } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { login } from '@/services/bundlemonService';
import GitHubIcon from '@mui/icons-material/GitHub';
import { userStore } from '@/stores/UserStore';
import { observer } from 'mobx-react-lite';
import { configStore } from '@/stores/ConfigStore';

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
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (code) {
      (async () => {
        try {
          const cachedFrom = from;

          // remove query params from url
          navigate('', {
            replace: true,
          });

          await login(code);
          userStore.init();

          if (cachedFrom) {
            navigate(cachedFrom, { replace: true });
          }
        } catch (ex) {
          setError((ex as Error).message || 'Error while trying to login, please try again');
        } finally {
          setIsLoading(false);
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
        <>
          {error && <Alert severity="error">{error}</Alert>}
          <LoadingButton
            variant="contained"
            startIcon={<GitHubIcon />}
            href={`https://github.com/login/oauth/authorize?client_id=${configStore.githubAppClientId}&redirect_uri=${redirectUri}`}
            loading={isLoading}
            sx={{ width: '100%' }}
          >
            Login with GitHub
          </LoadingButton>
        </>
      )}
    </Container>
  );
});

export default LoginPage;
