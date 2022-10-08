import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Divider, IconButton, List, ListItem, ListItemIcon, ListItemText, Popover } from '@mui/material';
import { userStore } from '@/stores/UserStore';
import AccountIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Close';
import { useSnackbar } from 'notistack';

const UserSection = observer(() => {
  const { user } = userStore;
  const isLoggedIn = !!user;
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    closeMenu();

    await userStore.logout();

    enqueueSnackbar('Successfully logged out', { variant: 'success' });
  };

  if (isLoggedIn) {
    return (
      <>
        <IconButton color="inherit" onClick={handleMenu}>
          <AccountIcon />
        </IconButton>
        <Popover
          open={!!anchorEl}
          anchorEl={anchorEl}
          onClose={closeMenu}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <List component="nav">
            <ListItem>
              <ListItemText primary={user.name} />
            </ListItem>
          </List>
          <Divider />
          <List component="nav">
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Popover>
      </>
    );
  }

  return (
    <Button color="inherit" href={`/login?from=${window.location.pathname}${window.location.search}`}>
      Login
    </Button>
  );
});

export default UserSection;
