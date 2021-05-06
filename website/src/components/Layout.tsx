import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import AppBar from '@material-ui/core/AppBar';
import Typography from '@material-ui/core/Typography';
import LogoSVG from '../assets/Logo.svg';

const useStyles = makeStyles((theme) => ({
  appBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: '64px',
    padding: theme.spacing(1, 3),
    color: '#000',
    backgroundColor: '#fff',
    '&svg': {
      marginRight: theme.spacing(2),
    },
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: theme.spacing(11),
    paddingBottom: theme.spacing(2),
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '300px',
    padding: theme.spacing(6),
  },
}));

const Layout: React.FC = ({ children }) => {
  const classes = useStyles();

  return (
    <>
      <AppBar position="fixed" color="default" className={classes.appBar}>
        <LogoSVG height="100%" />
        <Typography variant="h6" component="span">
          BundleMon
        </Typography>
      </AppBar>
      <Container component="main" maxWidth="lg" className={classes.container}>
        {children || <div />}
      </Container>
    </>
  );
};

export default Layout;
