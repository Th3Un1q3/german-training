import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { SessionConfig, SessionResult } from '../types';

interface SessionCompleteProps {
  sessionConfig: SessionConfig;
  results: SessionResult[];
  onNewSession: () => void;
}

export function SessionComplete({ sessionConfig, results, onNewSession }: SessionCompleteProps) {
  const score = results.filter(r => r.validation.isCorrect).length;

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-[#1A1A1A] rounded-[32px] p-10 shadow-xl border border-[#2A2A2A] text-center"
      >
        <Trophy size={64} className="text-[#8A8A60] mx-auto mb-6" />
        <h2 className="text-4xl font-bold mb-2 text-[#E5E5E0]">Session Complete!</h2>
        <p className="text-xl text-[#9A9A80] mb-8">You scored {score} out of {sessionConfig.totalExercises}</p>

        <button
          onClick={onNewSession}
          className="w-full py-4 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] transition-colors"
        >
          Start New Session
        </button>
      </motion.div>
    </div>
  );
}
