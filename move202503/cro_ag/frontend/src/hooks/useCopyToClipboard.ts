import { useState, useEffect } from 'react';

const useCopyToClipboard = () => {
  const [copyState, setCopyState] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    // ** copyState * true，*****
    if (copyState) {
      timer = setTimeout(() => {
        setCopyState(false);
      }, 800);
    }

    // ****：****** copyState ********
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [copyState]); // ** copyState ***

  const handleCopy = async (text: string | undefined) => {
    if (!text) {
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(true); // ** copyState **，useEffect ******
    } catch (error) {
      setCopyState(false);
    }
  };

  return { copyState, handleCopy };
};

export default useCopyToClipboard;
