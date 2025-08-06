import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-teal-500"></div>
    </div>
  );
};

export default Loader;
