import { motion } from 'motion/react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { ValidationResult } from '../types';

interface FeedbackProps {
  validation: ValidationResult;
  onNext: () => void;
}

export function Feedback({ validation, onNext }: FeedbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[32px] p-8 border shadow-lg",
        validation.isCorrect ? "bg-green-950 border-green-800" : "bg-red-950 border-red-800"
      )}
    >
      <div className="flex items-start gap-4 mb-6">
        {validation.isCorrect ? (
          <CheckCircle2 className="text-green-400 shrink-0" size={32} />
        ) : (
          <XCircle className="text-red-400 shrink-0" size={32} />
        )}
        <div>
          <h3 className={cn(
            "text-2xl font-bold mb-1",
            validation.isCorrect ? "text-green-300" : "text-red-300"
          )}>
            {validation.isCorrect ? "Excellent!" : "Not quite right"}
          </h3>
          {validation.transcription && (
            <p className="text-sm opacity-70 italic mb-2 text-[#E5E5E0]">You said: &ldquo;{validation.transcription}&rdquo;</p>
          )}
        </div>
      </div>

      {!validation.isCorrect && (
        <div className="mb-6">
          <span className="text-xs uppercase font-bold tracking-widest opacity-60 block mb-2 text-[#9A9A80]">Correction</span>
          <p className="text-2xl font-medium text-[#E5E5E0]">{validation.correction}</p>
        </div>
      )}

      <div className="mb-6">
        <span className="text-xs uppercase font-bold tracking-widest opacity-60 block mb-2 text-[#9A9A80]">Explanation</span>
        <p className="text-[#9A9A80] leading-relaxed">{validation.explanation}</p>
      </div>

      {validation.highlightedErrors.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {validation.highlightedErrors.map((err, i) => (
            <div key={i} className="px-4 py-2 bg-[#1A1A1A] rounded-xl border border-red-900 shadow-sm">
              <span className="font-bold text-red-400">{err.word}</span>: <span className="text-sm text-[#9A9A80]">{err.error}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        className="mt-8 w-full py-4 bg-[#E5E5E0] text-[#0F0F0F] rounded-2xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
      >
        Next Exercise <ChevronRight size={20} />
      </button>
    </motion.div>
  );
}
