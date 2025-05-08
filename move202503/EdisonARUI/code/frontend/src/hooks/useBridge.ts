import { useState } from 'react';

export const useBridge = () => {
  const [loading, setLoading] = useState(false);
  
  return {
    loading,
  };
};

export default useBridge;
