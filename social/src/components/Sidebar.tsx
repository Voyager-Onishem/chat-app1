import * as React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlobalStyles from '@mui/joy/GlobalStyles';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Chip from '@mui/joy/Chip';
import Divider from '@mui/joy/Divider';
import IconButton from '@mui/joy/IconButton';
import Input from '@mui/joy/Input';
import List from '@mui/joy/List';
import ListItem from '@mui/joy/ListItem';
import ListItemButton, { listItemButtonClasses } from '@mui/joy/ListItemButton';
import ListItemContent from '@mui/joy/ListItemContent';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import SupportRoundedIcon from '@mui/icons-material/SupportRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import BrightnessAutoRoundedIcon from '@mui/icons-material/BrightnessAutoRounded';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import AnnouncementRoundedIcon from '@mui/icons-material/AnnouncementRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';

import ColorSchemeToggle from './ColorSchemeToggle';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';
import { performCompleteLogout, clearAllStorage, clearAllCookies } from '../utils/auth-cleanup';

function Toggler(props: {
  defaultExpanded?: boolean;
  children: React.ReactNode;
  renderToggle: (params: {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  }) => React.ReactNode;
}) {
  const { defaultExpanded = false, renderToggle, children } = props;
  const [open, setOpen] = React.useState(defaultExpanded);
  return (
    <React.Fragment>
      {renderToggle({ open, setOpen })}
      <Box
        sx={[
          {
            display: 'grid',
            transition: '0.2s ease',
            '& > *': {
              overflow: 'hidden',
            },
          },
          open ? { gridTemplateRows: '1fr' } : { gridTemplateRows: '0fr' },
        ]}
      >
        {children}
      </Box>
    </React.Fragment>
  );
}

/**
 * Main app sidebar navigation.
 */
export default function Sidebar(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Safe auth context access
  let user = null;
  let profile = null;
  let signOut = null;
  let authError = false;
  
  try {
    const authContext = useAuth();
    user = authContext.user;
    profile = authContext.profile;
    signOut = authContext.signOut;
  } catch {
    console.warn('Auth context not available in Sidebar');
    authError = true;
  }
  
  // Handle auth errors consistently
  React.useEffect(() => {
    if (authError) {
      navigate('/login');
    }
  }, [navigate, authError]);
  
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleLogout = async () => {
    try {
      // Show confirmation dialog
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (!confirmed) return;

      // Show loading state
      const logoutButton = document.querySelector('[data-testid="logout-button"]') as HTMLElement;
      if (logoutButton) {
        logoutButton.style.pointerEvents = 'none';
        logoutButton.style.opacity = '0.6';
      }

      // Use comprehensive logout
      await performCompleteLogout();
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
      // Show success message
      console.log('Successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback cleanup
      try {
        if (signOut) {
          await signOut();
        }
        clearAllStorage();
        clearAllCookies();
        window.location.href = '/login';
      } catch (fallbackError) {
        console.error('Fallback logout failed:', fallbackError);
        window.location.href = '/login';
      }
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: 'fixed', md: 'sticky' },
        transform: {
          xs: 'translateX(calc(100% * (var(--SideNavigation-slideIn, 0) - 1)))',
          md: 'none',
        },
        transition: 'transform 0.4s, width 0.4s',
        zIndex: 10000,
        height: '100dvh',
        width: 'var(--Sidebar-width)',
        top: 0,
        p: 2,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        borderRight: '1px solid',
        borderColor: 'divider',
      }}
    >
      <GlobalStyles
        styles={(theme) => ({
          ':root': {
            '--Sidebar-width': '220px',
            [theme.breakpoints.up('lg')]: {
              '--Sidebar-width': '240px',
            },
          },
        })}
      />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <IconButton variant="soft" color="primary" size="sm">
          <BrightnessAutoRoundedIcon />
        </IconButton>
        <Typography level="title-lg">Alumni Network</Typography>
        <NotificationDropdown />
        <ColorSchemeToggle sx={{ ml: 'auto' }} />
      </Box>
      <Input 
        size="sm" 
        startDecorator={<SearchRoundedIcon />} 
        placeholder="Search alumni..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Box
        sx={{
          minHeight: 0,
          overflow: 'hidden auto',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          [`& .${listItemButtonClasses.root}`]: {
            gap: 1.5,
          },
        }}
      >
        <List
          size="sm"
          sx={{
            gap: 1,
            '--List-nestedInsetStart': '30px',
            '--ListItem-radius': (theme) => theme.vars.radius.sm,
          }}
        >
          <ListItem>
            <ListItemButton selected={isActive('/')} onClick={() => navigate('/')}>
              <HomeRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Home</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
          
          <ListItem>
            <ListItemButton selected={isActive('/directory')} onClick={() => navigate('/directory')}>
              <PeopleRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Directory</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton selected={isActive('/connections')} onClick={() => navigate('/connections')}>
              <GroupRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Connections</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton selected={isActive('/messages')} onClick={() => navigate('/messages')}>
              <QuestionAnswerRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Messages</Typography>
              </ListItemContent>
              <Chip size="sm" color="primary" variant="solid">
                4
              </Chip>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton selected={isActive('/jobs')} onClick={() => navigate('/jobs')}>
              <WorkRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Jobs</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton selected={isActive('/events')} onClick={() => navigate('/events')}>
              <EventRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Events</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          <ListItem>
            <ListItemButton selected={isActive('/announcements')} onClick={() => navigate('/announcements')}>
              <AnnouncementRoundedIcon />
              <ListItemContent>
                <Typography level="title-sm">Announcements</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>

          {profile?.role === 'admin' && (
            <ListItem>
              <ListItemButton selected={isActive('/admin-dashboard')} onClick={() => navigate('/admin-dashboard')}>
                <AdminPanelSettingsRoundedIcon />
                <ListItemContent>
                  <Typography level="title-sm">Admin Dashboard</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
          )}

          <ListItem nested>
            <Toggler
              renderToggle={({ open, setOpen }) => (
                <ListItemButton onClick={() => setOpen(!open)}>
                  <PersonRoundedIcon />
                  <ListItemContent>
                    <Typography level="title-sm">Profile</Typography>
                  </ListItemContent>
                  <KeyboardArrowDownIcon
                    sx={[
                      open
                        ? {
                            transform: 'rotate(180deg)',
                          }
                        : {
                            transform: 'none',
                          },
                    ]}
                  />
                </ListItemButton>
              )}
            >
              <List sx={{ gap: 0.5 }}>
                <ListItem sx={{ mt: 0.5 }}>
                  <ListItemButton selected={isActive('/profile')} onClick={() => navigate('/profile')}>
                    My Profile
                  </ListItemButton>
                </ListItem>
                <ListItem>
                  <ListItemButton>
                    Settings
                  </ListItemButton>
                </ListItem>
              </List>
            </Toggler>
          </ListItem>
        </List>
        
        <List
          size="sm"
          sx={{
            mt: 'auto',
            flexGrow: 0,
            '--ListItem-radius': (theme) => theme.vars.radius.sm,
            '--List-gap': '8px',
            mb: 2,
          }}
        >
          <ListItem>
            <ListItemButton>
              <SupportRoundedIcon />
              Support
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton>
              <SettingsRoundedIcon />
              Settings
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
      <Divider />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Avatar
          variant="outlined"
          size="sm"
          src={profile?.profile_picture_url || undefined}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography level="title-sm">{profile?.full_name || user?.email}</Typography>
          <Typography level="body-xs">{profile?.role || 'User'}</Typography>
        </Box>
        <IconButton size="sm" variant="plain" color="neutral" onClick={handleLogout} data-testid="logout-button">
          <LogoutRoundedIcon />
        </IconButton>
      </Box>
    </Sheet>
  );
} 