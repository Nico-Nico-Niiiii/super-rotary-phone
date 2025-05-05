import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import gyan_logo from '../../assets/images/logo.png'

const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

  // Function to render the appropriate auth button
  const renderAuthButton = () => {
    if (location.pathname === '/signup') {
      return (
        <Link
          to="/signin"
          className="bg-primary-light hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Sign In
        </Link>
      );
    } else if (location.pathname === '/signin') {
      return (
        <Link
          to="/signup"
          className="bg-primary-light hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Sign Up
        </Link>
      );
    } else {
      return (
        <Link
          to="/signin"
          className="bg-primary-light hover:bg-primary-dark text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Sign In / Sign Up
        </Link>
      );
    }
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img
              src={gyan_logo}
              alt="GYAN Logo"
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-primary-light">
              Home
            </Link>
            {/* <Link to="/explore" className="text-gray-600 dark:text-gray-300 hover:text-primary-light">
              Explore
            </Link>
            <Link to="/news" className="text-gray-600 dark:text-gray-300 hover:text-primary-light">
              News
            </Link>
            <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-primary-light">
              Contact
            </Link> */}
          </nav>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-light"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Dynamic Auth Button */}
            {renderAuthButton()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;