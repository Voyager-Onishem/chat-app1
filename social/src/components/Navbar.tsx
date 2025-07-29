import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../supabase-client';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        // Check if user is admin
        const { data: adminCheck } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(!!adminCheck);
      }
    };
    checkAuth();
    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session?.user);
      if (session?.user) {
        const { data: adminCheck } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();
        
        setIsAdmin(!!adminCheck);
      } else {
        setIsAdmin(false);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    navigate('/login');
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
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="ml-4 bg-red-500 px-3 py-1 rounded text-white hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center">
            {/* Auth logic handled above */}
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
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left bg-red-500 px-3 py-2 rounded-md text-base font-medium text-white hover:bg-red-600 mt-2"
                      >
                        Logout
                      </button>
                    )}
                  </div>
        </div>
      )}
    </nav>
  );
};