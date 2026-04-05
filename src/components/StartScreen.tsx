import { motion } from 'motion/react';
import { BookOpen, ArrowRight, Loader2, Settings, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { getStoredApiKey } from '../lib/gemini';

const DEFAULT_SUGGESTIONS = ['Dative Case', 'Accusative Case', 'Passive Voice', 'Modal Verbs', 'Subjunctive II'];

interface StartScreenProps {
  topic: string;
  totalExercises: number;
  loading: boolean;
  error: string | null;
  recentTopics: string[];
  onTopicChange: (topic: string) => void;
  onTotalExercisesChange: (n: number) => void;
  onStart: () => void;
  onRemoveTopic: (topic: string) => void;
  onShowSettings: () => void;
}

export function StartScreen({
  topic, totalExercises, loading, error, recentTopics,
  onTopicChange, onTotalExercisesChange, onStart, onRemoveTopic, onShowSettings,
}: StartScreenProps) {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-[#1A1A1A] rounded-[32px] p-10 shadow-xl border border-[#2A2A2A]"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#8A8A60] rounded-full flex items-center justify-center text-white">
              <BookOpen size={24} />
            </div>
            <h1 className="text-3xl font-bold text-[#E5E5E0]">German Tutor</h1>
          </div>
          <button
            onClick={onShowSettings}
            className="p-2 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#9A9A80] hover:bg-[#252525] transition-all"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>

        {!getStoredApiKey() && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-800 rounded-2xl">
            <p className="font-bold text-amber-400 mb-1">API key required</p>
            <p className="text-sm text-amber-300/80 mb-2">
              You need a Gemini API key to use this app.
            </p>
            <button
              onClick={onShowSettings}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#8A8A60] underline hover:text-[#E5E5E0]"
            >
              Open Settings to add your key <ArrowRight size={14} />
            </button>
          </div>
        )}

        <p className="text-lg text-[#9A9A80] mb-6 italic">
          What German grammar rule would you like to practice today?
        </p>

        <input
          type="text"
          value={topic}
          onChange={(e) => onTopicChange(e.target.value)}
          placeholder="e.g., Dative Case, Passive Voice..."
          className="w-full px-6 py-4 bg-[#141414] border-none rounded-2xl text-xl mb-2 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-[#E5E5E0] placeholder-[#555]"
        />

        <div className="flex flex-wrap gap-2 mb-6">
          {recentTopics.length > 0 && (
            <span className="text-xs text-[#9A9A80] uppercase tracking-widest font-bold self-center mr-1">Recent</span>
          )}
          {recentTopics.map(t => (
            <span
              key={`recent-${t}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full text-sm transition-all",
                topic === t ? "bg-[#8A8A60] text-white" : "bg-[#252525] text-[#9A9A80] hover:bg-[#303030]"
              )}
            >
              <button onClick={() => onTopicChange(t)} className="pl-3 py-1">
                {t}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTopic(t);
                  if (topic === t) onTopicChange('');
                }}
                className="pr-2 py-1 opacity-50 hover:opacity-100 transition-opacity"
                title="Remove"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {DEFAULT_SUGGESTIONS.filter(t => !recentTopics.includes(t)).map(t => (
            <button
              key={t}
              onClick={() => onTopicChange(t)}
              className={cn(
                "px-3 py-1 rounded-full text-sm transition-all",
                topic === t ? "bg-[#8A8A60] text-white" : "bg-[#252525] text-[#9A9A80] hover:bg-[#303030]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="block text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-2">Number of sentences</label>
        <input
          type="number"
          min="1"
          max="50"
          value={totalExercises}
          onChange={(e) => onTotalExercisesChange(parseInt(e.target.value))}
          className="w-full px-6 py-4 bg-[#141414] border-none rounded-2xl text-xl mb-8 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-[#E5E5E0]"
        />

        <button
          onClick={onStart}
          disabled={!topic || loading}
          className="w-full py-4 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : "Start Session"}
        </button>
        {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      </motion.div>
    </div>
  );
}
