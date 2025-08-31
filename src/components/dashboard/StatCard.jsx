// src/components/dashboard/StatCard.jsx

import React from 'react';

const StatCard = ({ icon, title, value, description }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-start gap-4">
      <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;