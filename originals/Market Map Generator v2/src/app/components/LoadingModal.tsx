import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
}

export function LoadingModal({ isOpen }: LoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 min-w-[300px]">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-1">Loading Market Map</h3>
          <p className="text-sm text-gray-500">Please wait while we fetch your data...</p>
        </div>
      </div>
    </div>
  );
}
