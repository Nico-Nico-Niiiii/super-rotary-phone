import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-gray-500 dark:text-gray-400">
              Copyright © 2024 Capgemini Engineering Company. All rights reserved.
            </p>
          </div>

          {/* Credit */}
          <div className="text-center md:text-right">
            <p className="text-gray-500 dark:text-gray-400">
              Designed by:{' '}
              <span className="text-primary-light">Intelligent Devices AIML</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;