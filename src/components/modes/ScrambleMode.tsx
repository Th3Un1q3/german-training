import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ScrambleModeProps {
  scrambledWords: string[];
  userAnswer: string[];
  disabled: boolean;
  onToggleWord: (word: string, index: number) => void;
  onCheck: () => void;
}

export function ScrambleMode({ scrambledWords, userAnswer, disabled, onToggleWord, onCheck }: ScrambleModeProps) {
  return (
    <motion.div
      key="scramble"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="min-h-[80px] p-4 bg-[#141414] rounded-2xl flex flex-wrap gap-3 mb-8 border-2 border-dashed border-[#2A2A2A]">
        {userAnswer.map((item) => {
          const word = item.split('-')[0];
          return (
            <button
              key={item}
              disabled={disabled}
              onClick={() => onToggleWord(word, parseInt(item.split('-')[1]))}
              className="px-5 py-2 bg-[#252525] rounded-xl shadow-sm border border-[#2A2A2A] hover:bg-red-950 hover:border-red-800 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed text-[#E5E5E0]"
            >
              {word}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        {scrambledWords.map((word, i) => {
          const isUsed = userAnswer.includes(`${word}-${i}`);
          return (
            <button
              key={`${word}-${i}`}
              disabled={isUsed || disabled}
              onClick={() => onToggleWord(word, i)}
              className={cn(
                "px-5 py-2 rounded-xl border transition-all text-[#E5E5E0]",
                isUsed
                  ? "opacity-20 border-transparent bg-transparent"
                  : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#8A8A60] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {word}
            </button>
          );
        })}
      </div>

      <button
        onClick={onCheck}
        disabled={userAnswer.length === 0 || disabled}
        className="w-full py-4 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
      >
        {disabled ? <Loader2 className="animate-spin" /> : "Check Answer"}
      </button>
    </motion.div>
  );
}
