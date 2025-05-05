import { useMediaQuery } from 'react-responsive';

export const useTabletOrMobile = () => {
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1224px)' });
  return isTabletOrMobile;
};
