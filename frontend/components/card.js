// -- RMK: Reusable Card components for consistent styling. Version 1.0
// -- FILE: frontend/src/components/Card.js

import React from 'react';

// Custom Card components for consistent styling
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }) => (
  <div className={`flex flex-row items-center justify-between pb-2 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-sm font-medium ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={`text-2xl font-bold ${className}`}>
    {children}
  </div>
);
