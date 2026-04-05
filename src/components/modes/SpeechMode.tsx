import { motion } from 'motion/react';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SpeechModeProps {
  isRecording: boolean;
  disabled: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export function SpeechMode({ isRecording, disabled, onStartRecording, onStopRecording }: SpeechModeProps) {
  return (
    <motion.div
      key="speech"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center gap-6 py-10"
    >
      <button
        onMouseDown={!disabled ? onStartRecording : undefined}
        onMouseUp={!disabled ? onStopRecording : undefined}
        onMouseLeave={!disabled ? onStopRecording : undefined}
        onTouchStart={!disabled ? onStartRecording : undefined}
        onTouchEnd={!disabled ? onStopRecording : undefined}
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          disabled
            ? "opacity-50 cursor-not-allowed bg-gray-700"
            : isRecording
              ? "bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              : "bg-[#8A8A60] hover:bg-[#9A9A70] shadow-lg"
        )}
      >
        {isRecording ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
      </button>
      <p className="text-[#9A9A80] italic">
        {isRecording ? "Listening..." : "Hold to speak in German"}
      </p>
    </motion.div>
  );
}
