import { motion } from 'motion/react';
import { Info, Loader2 } from 'lucide-react';
import { RuleInfo } from '../types';
import { GitHubLink } from './GitHubLink';

interface RuleReviewProps {
  ruleInfo: RuleInfo;
  loading: boolean;
  onStart: () => void;
  onCancel: () => void;
}

export function RuleReview({ ruleInfo, loading, onStart, onCancel }: RuleReviewProps) {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full bg-[#1A1A1A] rounded-[32px] p-10 shadow-xl border border-[#2A2A2A]"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#8A8A60] rounded-full flex items-center justify-center text-white">
              <Info size={24} />
            </div>
            <h1 className="text-3xl font-bold text-[#E5E5E0]">{ruleInfo.title}</h1>
          </div>
            <div className="flex items-center gap-2">
              <GitHubLink />
              <button onClick={onCancel} className="text-[#9A9A80] hover:text-[#E5E5E0]">Cancel</button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <h3 className="text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-4">Quick Reference</h3>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-sm mb-1 text-[#E5E5E0]">When to use</p>
                <ul className="list-disc list-inside text-[#9A9A80] text-sm space-y-1">
                  {ruleInfo.cheatSheet.useCases.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-bold text-sm mb-1 text-[#E5E5E0]">Watch out for</p>
                <ul className="list-disc list-inside text-[#9A9A80] text-sm space-y-1">
                  {ruleInfo.cheatSheet.nuances.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-4">Examples</h3>
            <div className="space-y-4">
              {ruleInfo.cheatSheet.examples.map((ex, i) => (
                <div key={i} className="p-3 bg-[#141414] rounded-xl">
                  <p className="font-bold text-[#E5E5E0]">{ex.de}</p>
                  <p className="text-sm text-[#9A9A80] italic">{ex.en}</p>
                  <p className="text-xs text-[#9A9A80] mt-1 opacity-70">{ex.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-[#8A8A60]/10 rounded-2xl mb-10 border border-[#8A8A60]/15">
            <h3 className="text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-2">What you'll practice</h3>
          <p className="text-sm text-[#9A9A80] mb-2"><strong className="text-[#E5E5E0]">Focus:</strong> {ruleInfo.exerciseDesign.focusAreas.join(', ')}</p>
          <p className="text-sm text-[#9A9A80]"><strong className="text-[#E5E5E0]">Difficulty:</strong> {ruleInfo.exerciseDesign.difficultyProgression}</p>
        </div>

        <button
          onClick={onStart}
          disabled={loading}
          className="w-full py-4 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Start Exercises"}
        </button>
      </motion.div>
    </div>
  );
}
