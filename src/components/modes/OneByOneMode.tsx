import { motion } from 'motion/react';
import { Eraser } from 'lucide-react';

interface OneByOneModeProps {
  userAnswer: string[];
  shuffledCandidates: string[][];
  currentStep: number;
  disabled: boolean;
  onSelectWord: (word: string) => void;
  onRemoveLastWord: () => void;
}

export function OneByOneMode({
  userAnswer, shuffledCandidates, currentStep, disabled,
  onSelectWord, onRemoveLastWord,
}: OneByOneModeProps) {
  return (
    <motion.div
      key="one-by-one"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="mb-8 flex flex-wrap items-center gap-2 text-2xl">
        {userAnswer.map((word, i) => (
          <span key={i} className="text-[#E5E5E0]">{word}</span>
        ))}
        {userAnswer.length > 0 && !disabled && (
          <button
            onClick={onRemoveLastWord}
            className="p-2 text-[#9A9A80] hover:text-red-400 transition-colors"
            title="Remove last word"
          >
            <Eraser size={20} />
          </button>
        )}
        <span className="text-[#9A9A80] opacity-30">...</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {shuffledCandidates[currentStep]?.map((candidate, i) => (
          <button
            key={i}
            onClick={() => onSelectWord(candidate)}
            disabled={disabled}
            className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl hover:border-[#8A8A60] hover:shadow-md transition-all text-lg text-center text-[#E5E5E0] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {candidate}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
