import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

// This component is designed for the sidebar to show specific cloud routes with a "Coming Soon" tag
const CloudRouteItem = ({ 
  title, 
  icon, 
  path, 
  isExpanded, 
  expandedItem, 
  setExpandedItem, 
  location,
  subItems
}) => {
  
  // Function to check if a subitem should show the "Coming Soon" tag
  const isComingSoon = (subItemPath) => {
    const comingSoonPaths = [
      '/dashboard/cloud/bedrock',
      '/dashboard/cloud/nemo-llm',
      '/dashboard/cloud/google-vertex'
    ];
    return comingSoonPaths.includes(subItemPath);
  };

  const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
  const isSubMenuOpen = expandedItem === title;

  const handleItemClick = () => {
    if (subItems) {
      setExpandedItem(isSubMenuOpen ? null : title);
    }
  };

  return (
    <div>
      <div
        onClick={handleItemClick}
        className={`flex items-center px-3 py-2.5 transition-all duration-300 ease-in-out cursor-pointer
          ${isActive
            ? 'bg-primary-light/10 text-primary-light border-r-4 border-primary-light' 
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
      >
        <div className="flex items-center justify-center min-w-[24px]">
          {icon}
        </div>
        
        {isExpanded && (
          <>
            <span className="ml-3 text-sm transition-all duration-300 ease-in-out whitespace-nowrap">
              {title}
            </span>
            
            {/* We don't need a Coming Soon tag on the main Cloud AI Studio item */}
            
            {subItems && (
              <ChevronDown 
                size={16} 
                className={`ml-auto transition-transform duration-300 ${isSubMenuOpen ? 'rotate-180' : ''}`}
              />
            )}
          </>
        )}
      </div>

      {/* Sub Items */}
      {subItems && isExpanded && isSubMenuOpen && (
        <div className="overflow-hidden transition-all duration-300">
          {subItems.map((subItem) => (
            <Link
              key={subItem.path}
              to={subItem.path}
              className={`flex items-center px-3 py-2 text-sm pl-12 transition-all duration-300 ease-in-out whitespace-nowrap
                ${location.pathname === subItem.path 
                  ? 'text-primary-light bg-primary-light/5' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className="flex-1">{subItem.title}</span>
              {isComingSoon(subItem.path) && (
                <span className="px-1.5 py-0.5 bg-primary-light/20 text-primary-light text-xs rounded-full">
                  Soon
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudRouteItem;