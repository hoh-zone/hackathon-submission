/* eslint-disable prettier/prettier */
import { DependencyList, useEffect, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/ban-types
function useUpdateEffect(effect: Function, deps: DependencyList | undefined) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effect();
  }, deps);
}

export default useUpdateEffect;
