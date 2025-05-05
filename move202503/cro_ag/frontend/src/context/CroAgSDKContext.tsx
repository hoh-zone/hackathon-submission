import React, { createContext, useContext } from 'react';
import { CroAgSDK } from 'cro-sdk';

// ** Context
const CroAgSDKContext = createContext<CroAgSDK | null>(null);

// ** Provider **
export const CroAgSDKProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const sdk = new CroAgSDK(); // *******

  return (
    <CroAgSDKContext.Provider value={sdk}>{children}</CroAgSDKContext.Provider>
  );
};

// *** Hook
export const useCroAgSDK = () => {
  const context = useContext(CroAgSDKContext);
  if (!context) {
    throw new Error('useCroAgSDK must be used within a CroAgSDKProvider');
  }
  return context;
};
