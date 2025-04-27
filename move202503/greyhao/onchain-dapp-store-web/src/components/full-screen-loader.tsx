import { createPortal } from "react-dom";
import { Loader2 } from 'lucide-react';

export function FullScreenLoader() {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Loader2 className="h-10 w-10 animate-spin text-white" />
    </div>,
    document.body
  );
}