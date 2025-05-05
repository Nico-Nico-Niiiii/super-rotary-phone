import React from 'react';

const Header = ({ modelTitle }) => {
  return (
    <div className="p-4 border-b border-gray-200 bg-[#FFFFFF] text-[#111827]">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">nvidia / </span>
          <span className="font-semibold">{modelTitle || 'cosmos'}</span>
          <span className="bg-gray-200 text-xs px-2 py-0.5 rounded ml-2">PREVIEW</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#00A3E0] text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 focus:outline-none">
          Download and Post-Train
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Generates physics-aware video world states from text and image prompts for physical AI development.
      </p>
    </div>
  );
};

export default Header;

