import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
  paper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    alignSelf: 'center',
    padding: theme.spacing(6),
    maxWidth: '700px',
  },
}));

const HomePage = () => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
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
    </Paper>
  );
};

export default HomePage;
