import { useState } from 'react';

export const useBondPool = () => {
  const [loading, setLoading] = useState(false);
  
  return {
    loading,
  };
};

export default useBondPool;
