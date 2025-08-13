import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
// import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { Modal, ModalDialog, ModalClose, Typography, Button, Box } from '@mui/joy';
import { performCompleteLogout, clearAllStorage, clearAllCookies } from '../utils/auth-cleanup';
import { checkAdminAccess } from '../utils/robust-query';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        // Check if user is admin using robust query
        const isAdminUser = await checkAdminAccess(user.id);
        setIsAdmin(isAdminUser);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      setShowLogoutModal(false);
      await performCompleteLogout();
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback cleanup
      try {
        await signOut();
        clearAllStorage();
        clearAllCookies();
        window.location.href = '/login';
      } catch (fallbackError) {
        console.error('Fallback logout failed:', fallbackError);
        window.location.href = '/login';
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  return (
    <nav className="fixed top-0 w-full z-40 bg-[rgba(10,10,10,0.8)] backdrop-blur-lg border-b border-white/10 shadow-lg">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="font-mono text-xl font-bold text-white">
            forum<span className="text-purple-500">.app</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Home
            </Link>
            <Link
              to="/profile"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Profile
            </Link>
            <Link
              to="/directory"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Directory
            </Link>
            <Link
              to="/connections"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Connections
            </Link>
            <Link
              to="/messages"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Messages
            </Link>
            <Link
              to="/announcements"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Announcements
            </Link>
            <Link
              to="/jobs"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Jobs
            </Link>
            <Link
              to="/events"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Events
            </Link>
            {isAdmin && (
              <Link
                to="/admin-dashboard"
                className="text-gray-300 hover:text-white transition-colors"
              >
                Admin Dashboard
              </Link>
            )}
          </div>

          {/* Desktop Auth & Notifications */}
          <div className="hidden md:flex items-center space-x-4">
            {/* <ConnectionStatusIndicator /> */}
            {isAuthenticated && <NotificationDropdown />}
            {isAuthenticated && (
              <button
                onClick={handleLogoutClick}
                className="bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600 transition-colors text-sm md:text-base"
              >
                Logout
              </button>
            )}
          </div>



          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="text-gray-300 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[rgba(10,10,10,0.9)]">
                            <div className="px-2 pt-2 pb-3 space-y-1">
                    <Link
                      to="/"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Home
                    </Link>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/directory"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Directory
                    </Link>
                    <Link
                      to="/connections"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Connections
                    </Link>
                    <Link
                      to="/messages"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Messages
                    </Link>
                    <Link
                      to="/announcements"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Announcements
                    </Link>
                    <Link
                      to="/jobs"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Jobs
                    </Link>
                    <Link
                      to="/events"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                    >
                      Events
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin-dashboard"
                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    {isAuthenticated && (
                      <>
                        <div className="px-3 py-2">
                          <NotificationDropdown />
                        </div>
                        <button
                          onClick={handleLogoutClick}
                          className="block w-full text-left bg-red-500 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-600 mt-2 min-h-[44px]"
                        >
                          Logout
                        </button>
                      </>
                    )}
                  </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <Modal open={showLogoutModal} onClose={handleLogoutCancel}>
        <ModalDialog
          aria-labelledby="logout-modal-title"
          aria-describedby="logout-modal-description"
          sx={{
            maxWidth: 400,
            width: '90vw',
          }}
        >
          <ModalClose onClick={handleLogoutCancel} />
          <Typography
            id="logout-modal-title"
            component="h2"
            level="h4"
            textColor="inherit"
            fontWeight="lg"
            mb={1}
          >
            Confirm Logout
          </Typography>
          <Typography
            id="logout-modal-description"
            textColor="text.tertiary"
            mb={3}
          >
            Are you sure you want to logout? You will be redirected to the login page.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button 
              variant="plain" 
              color="neutral" 
              onClick={handleLogoutCancel}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button 
              variant="solid" 
              color="danger" 
              onClick={handleLogoutConfirm}
              loading={isLoggingOut}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? 'Logging out...' : 'Yes, Logout'}
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </nav>
  );
};