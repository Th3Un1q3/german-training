import { motion } from 'motion/react';
import { X, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { DEFAULT_MODEL, DEFAULT_BASE_URL } from '../lib/gemini';

interface SettingsModalProps {
  apiKey: string;
  model: string;
  baseUrl: string;
  availableModels: string[];
  modelsLoading: boolean;
  onApiKeyChange: (key: string) => void;
  onModelChange: (model: string) => void;
  onBaseUrlChange: (url: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function SettingsModal({
  apiKey, model, baseUrl, availableModels, modelsLoading,
  onApiKeyChange, onModelChange, onBaseUrlChange, onSave, onClose,
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#1A1A1A] rounded-[32px] p-8 shadow-xl border border-[#2A2A2A] relative"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#E5E5E0]">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-[#252525] text-[#9A9A80] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <label className="block text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-2">
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="Paste your Gemini API key here"
          className={cn(
            "w-full px-4 py-3 bg-[#141414] border rounded-2xl mb-1 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-[#E5E5E0] placeholder-[#555]",
            !apiKey ? "border-red-700 bg-red-950/30" : "border-[#2A2A2A]"
          )}
        />
        <p className="text-xs text-[#9A9A80] mb-4">
          <a
            href="https://aistudio.google.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#9A9A80] underline hover:text-[#E5E5E0] font-medium"
          >
            Get a free API key from Google AI Studio <ExternalLink size={12} />
          </a>
        </p>

        <label className="block text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-2">
          API Base URL
        </label>
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="https://generativelanguage.googleapis.com"
          className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-2xl mb-1 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-sm text-[#E5E5E0] placeholder-[#555]"
        />
        <p className="text-xs text-[#9A9A80] opacity-60 mb-4">
          Default is the Gemini API. Change this to use any OpenAI-compatible endpoint.
        </p>

        <label className="block text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-2">
          Model
        </label>
        {modelsLoading && (
          <div className="flex items-center gap-2 text-[#9A9A80] text-sm mb-2 px-1">
            <Loader2 className="animate-spin" size={16} /> Loading models…
          </div>
        )}
        <select
          value={model}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-2xl mb-6 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-[#E5E5E0]"
        >
          {!availableModels.includes(model) && (
            <option value={model}>{model}</option>
          )}
          {availableModels.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            onClick={() => {
              onApiKeyChange('');
              onModelChange(DEFAULT_MODEL);
              onBaseUrlChange(DEFAULT_BASE_URL);
            }}
            className="py-3 px-4 border border-red-800 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-950 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[#2A2A2A] rounded-2xl font-bold text-[#9A9A80] hover:bg-[#252525] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 py-3 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
}
