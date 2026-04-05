import { motion } from 'motion/react';
import { RuleInfo } from '../types';

interface HelpPanelProps {
  ruleInfo: RuleInfo;
  onClose: () => void;
}

export function HelpPanel({ ruleInfo, onClose }: HelpPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-8 overflow-hidden"
    >
      <div className="bg-[#8A8A60] text-white rounded-[32px] p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Grammar Help: {ruleInfo.title}</h3>
          <button onClick={onClose} className="opacity-60 hover:opacity-100">Close</button>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <p className="font-bold mb-2 text-sm uppercase tracking-widest opacity-70">Quick Reference</p>
            <div className="space-y-4">
              <div>
                <p className="font-bold text-sm">When to use</p>
                <ul className="list-disc list-inside text-sm opacity-90">
                  {ruleInfo.cheatSheet.useCases.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-bold text-sm">Watch out for</p>
                <ul className="list-disc list-inside text-sm opacity-90">
                  {ruleInfo.cheatSheet.nuances.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            </div>
          </div>
          <div>
            <p className="font-bold mb-2 text-sm uppercase tracking-widest opacity-70">Examples</p>
            <div className="space-y-3">
              {ruleInfo.cheatSheet.examples.map((ex, i) => (
                <div key={i} className="p-3 bg-white/10 rounded-xl">
                  <p className="font-bold">{ex.de}</p>
                  <p className="text-sm opacity-80 italic">{ex.en}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
