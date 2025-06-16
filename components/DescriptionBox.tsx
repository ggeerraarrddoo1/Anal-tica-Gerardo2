import React from 'react';
import Loader from './Loader';

interface DescriptionBoxProps {
  description: string;
  isLoading: boolean;
}

const DescriptionBox: React.FC<DescriptionBoxProps> = ({ description, isLoading }) => {
  return (
    <div className="bg-slate-600/50 p-5 rounded-md shadow">
      {isLoading ? (
        <div className="flex justify-center items-center h-20">
          <Loader />
        </div>
      ) : (
        <p id="descriptionText" className="text-slate-200 leading-relaxed whitespace-pre-line text-sm" dangerouslySetInnerHTML={{ __html: description }}></p>
      )}
    </div>
  );
};

export default DescriptionBox;