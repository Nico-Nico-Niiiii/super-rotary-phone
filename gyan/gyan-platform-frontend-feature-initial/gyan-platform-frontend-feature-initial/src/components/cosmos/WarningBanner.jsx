import React from 'react';

const WarningBanner = ({ onClose }) => {
  return (
    <div className="bg-gray-900 p-4 mx-4 my-2 rounded relative">
      <button className="absolute right-2 top-2 text-gray-500" onClick={onClose}>×</button>
      <p className="text-sm text-[#FFFFFF]">
        AI models generate responses and outputs based on complex algorithms and machine learning techniques, and those responses or outputs may be inaccurate, harmful, biased or indecent. By testing this model, you assume the risk of any harm caused by any response or output of the model. Please do not upload any confidential information or personal data unless expressly permitted. Your use is logged for security purposes.
      </p>
    </div>
  );
};

export default WarningBanner;