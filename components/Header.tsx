
import React from 'react';

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12.964 2.227a.75.75 0 01.372 1.325L11.5 8.25l5.69-5.69a.75.75 0 011.06 1.06L12.75 9.5l4.723-1.83a.75.75 0 01.976.976L16.62 13.5l5.743.164a.75.75 0 01.62 1.045l-5.69 10.046a.75.75 0 01-1.325-.372L11.75 16.5l-5.69 5.69a.75.75 0 01-1.06-1.06L10.5 15.25l-4.723 1.83a.75.75 0 01-.976-.976L6.62 11.25 1.04 11.05a.75.75 0 01-.62-1.045L6.11.958a.75.75 0 011.325.372L8.25 7.5l5.69-5.69a.75.75 0 01-.976-.583z" clipRule="evenodd" />
  </svg>
);


const Header: React.FC = () => {
  return (
    <header className="bg-brand-gray border-b border-gray-700 p-4 flex items-center justify-center shadow-md z-10">
      <div className="flex items-center space-x-2">
        <SparkleIcon />
        <h1 className="text-xl font-bold text-brand-text">Gemini AI Assistant</h1>
      </div>
    </header>
  );
};

export default Header;
