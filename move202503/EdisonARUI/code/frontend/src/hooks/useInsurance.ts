import { useState } from 'react';

export const useInsurance = () => {
  const [loading, setLoading] = useState(false);
  
  return {
    loading,
  };
};

export default useInsurance;
