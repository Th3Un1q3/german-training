import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  BookOpen, 
  LayoutGrid, 
  ArrowRight,
  Loader2,
  Trophy,
  Eraser,
  HelpCircle,
  Info,
  Settings,
  X,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { generateExercise, validateTranslation, transcribeAudio, generateRuleInfo, getStoredApiKey, setStoredApiKey, getStoredModel, setStoredModel, getStoredBaseUrl, setStoredBaseUrl, listAvailableModels, DEFAULT_MODEL, DEFAULT_BASE_URL } from './lib/gemini';
import { Exercise, Mode, ValidationResult, SessionConfig, SessionResult, RuleInfo } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RECENT_TOPICS_KEY = 'germanTutor_recentTopics';
const MAX_RECENT = 10;
const DEFAULT_SUGGESTIONS = ['Dative Case', 'Accusative Case', 'Passive Voice', 'Modal Verbs', 'Subjunctive II'];

function getRecentTopics(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_TOPICS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveRecentTopic(topic: string) {
  const recent = getRecentTopics().filter(t => t !== topic);
  recent.unshift(topic);
  localStorage.setItem(RECENT_TOPICS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function removeRecentTopic(topic: string) {
  const recent = getRecentTopics().filter(t => t !== topic);
  localStorage.setItem(RECENT_TOPICS_KEY, JSON.stringify(recent));
}

export default function App() {
  const [topic, setTopic] = useState('');
  const [totalExercises, setTotalExercises] = useState(10);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [usedSentences, setUsedSentences] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseQueue, setExerciseQueue] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [mode, setMode] = useState<Mode>('scramble');
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); 
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [shuffledCandidates, setShuffledCandidates] = useState<string[][]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [isRuleReview, setIsRuleReview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsApiKey, setSettingsApiKey] = useState(getStoredApiKey);
  const [settingsModel, setSettingsModel] = useState(getStoredModel);
  const [settingsBaseUrl, setSettingsBaseUrl] = useState(getStoredBaseUrl);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>(getRecentTopics);

  const resetSession = () => {
    setSessionConfig(null);
    setResults([]);
    setCurrentExerciseIndex(0);
    setIsSessionComplete(false);
    setUsedSentences([]);
    setExerciseQueue([]);
    setCurrentExercise(null);
    setUserAnswer([]);
    setValidation(null);
    setCurrentStep(0);
    setScrambledWords([]);
    setShuffledCandidates([]);
    setIsRuleReview(false);
    setError(null);
  };

  const fetchModels = async (apiKey?: string) => {
    if (apiKey !== undefined) {
      // Temporarily set the key so the API call uses it
      setStoredApiKey(apiKey);
    }
    if (!getStoredApiKey()) return;
    setModelsLoading(true);
    try {
      const models = await listAvailableModels();
      setAvailableModels(models);
    } catch {
      // Silently fail — user can still type a model name
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    if (showSettings) {
      fetchModels();
    }
  }, [showSettings]);
  
  useEffect(() => {
    if (currentExercise) {
      setShuffledCandidates(currentExercise.candidates.map(c => [...c].sort(() => Math.random() - 0.5)));
    }
  }, [currentExercise]);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const isApiError = (err: any): boolean => {
    if (!getStoredApiKey()) return true;
    const msg = err?.message || String(err);
    return /api.key|auth|401|403|invalid|not.configured/i.test(msg);
  };

  const handleApiError = (err: any, fallbackMsg: string) => {
    console.error(fallbackMsg, err);
    if (isApiError(err)) {
      setError("API error — check your API key and model in Settings.");
      setShowSettings(true);
    } else {
      setError(fallbackMsg);
    }
  };

  const saveSettings = () => {
    setStoredApiKey(settingsApiKey);
    setStoredModel(settingsModel);
    setStoredBaseUrl(settingsBaseUrl);
    setShowSettings(false);
    setError(null);
  };

  const settingsModal = showSettings ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#1A1A1A] rounded-[32px] p-8 shadow-xl border border-[#2A2A2A] relative"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#E5E5E0]">Settings</h2>
          <button
            onClick={() => setShowSettings(false)}
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
          value={settingsApiKey}
          onChange={(e) => setSettingsApiKey(e.target.value)}
          placeholder="Paste your Gemini API key here"
          className={cn(
            "w-full px-4 py-3 bg-[#141414] border rounded-2xl mb-1 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-[#E5E5E0] placeholder-[#555]",
            !settingsApiKey ? "border-red-700 bg-red-950/30" : "border-[#2A2A2A]"
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
          value={settingsBaseUrl}
          onChange={(e) => setSettingsBaseUrl(e.target.value)}
          placeholder="https://generativelanguage.googleapis.com"
          className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-2xl mb-1 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-sm text-[#E5E5E0] placeholder-[#555]"
        />
        <p className="text-xs text-[#9A9A80] opacity-60 mb-4">
          Default is the Gemini API. Change this to use any OpenAI-compatible endpoint.
        </p>

        <label className="block text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-2">
          Model
        </label>
        {modelsLoading ? (
          <div className="flex items-center gap-2 text-[#9A9A80] text-sm mb-2 px-1">
            <Loader2 className="animate-spin" size={16} /> Loading models…
          </div>
        ) : null}
        <select
          value={settingsModel}
          onChange={(e) => setSettingsModel(e.target.value)}
          className="w-full px-4 py-3 bg-[#141414] border border-[#2A2A2A] rounded-2xl mb-6 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-[#E5E5E0]"
        >
          {!availableModels.includes(settingsModel) && (
            <option value={settingsModel}>{settingsModel}</option>
          )}
          {availableModels.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setSettingsApiKey('');
              setSettingsModel(DEFAULT_MODEL);
              setSettingsBaseUrl(DEFAULT_BASE_URL);
            }}
            className="py-3 px-4 border border-red-800 rounded-2xl text-sm font-bold text-red-400 hover:bg-red-950 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setShowSettings(false)}
            className="flex-1 py-3 border border-[#2A2A2A] rounded-2xl font-bold text-[#9A9A80] hover:bg-[#252525] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={saveSettings}
            className="flex-1 py-3 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  ) : null;

  const startSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const info = await generateRuleInfo(topic);
      saveRecentTopic(topic);
      setRecentTopics(getRecentTopics());
      setSessionConfig({ topic, totalExercises, ruleInfo: info });
      setIsRuleReview(true);
    } catch (error: any) {
      handleApiError(error, "Failed to generate rule info. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startExercises = async () => {
    setLoading(true);
    setError(null);
    setResults([]);
    setCurrentExerciseIndex(0);
    setIsSessionComplete(false);
    setUsedSentences([]);
    
    try {
      const exercises = await generateExercise(topic, [], 3, sessionConfig?.ruleInfo);
      setCurrentExercise(exercises[0]);
      setExerciseQueue(exercises.slice(1));
      setUsedSentences(exercises.map(e => e.english));
      setScrambledWords([...exercises[0].words].sort(() => Math.random() - 0.5));
      setIsRuleReview(false);
    } catch (error: any) {
      handleApiError(error, "Failed to generate exercise. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const nextExercise = async (validation: ValidationResult) => {
    const newResults = [...results, { exercise: currentExercise!, validation }];
    setResults(newResults);
    
    if (newResults.length >= sessionConfig!.totalExercises) {
      setIsSessionComplete(true);
    } else {
      setLoading(true);
      setError(null);
      setValidation(null);
      setUserAnswer([]);
      setCurrentStep(0);
      setCurrentExerciseIndex(prev => prev + 1);
      
      let nextEx: Exercise;
      let newQueue = [...exerciseQueue];
      
      if (newQueue.length > 0) {
        nextEx = newQueue.shift()!;
        setExerciseQueue(newQueue);
        setCurrentExercise(nextEx);
        setScrambledWords([...nextEx.words].sort(() => Math.random() - 0.5));
        setLoading(false);
      } else {
        try {
          const exercises = await generateExercise(sessionConfig!.topic, usedSentences, 3, sessionConfig?.ruleInfo);
          nextEx = exercises[0];
          setExerciseQueue(exercises.slice(1));
          setCurrentExercise(nextEx);
          setUsedSentences(prev => [...prev, ...exercises.map(e => e.english)]);
          setScrambledWords([...nextEx.words].sort(() => Math.random() - 0.5));
        } catch (error: any) {
          handleApiError(error, "Failed to generate exercise. Please try again later.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    setValidation(null);
    setUserAnswer([]);
    setCurrentStep(0);
    if (currentExercise) {
      setScrambledWords([...currentExercise.words].sort(() => Math.random() - 0.5));
    }
  };

  // --- Speech Mode ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setLoading(true);
          try {
            const transcription = await transcribeAudio(base64);
            const result = await validateTranslation(sessionConfig!.topic, currentExercise!.english, transcription, currentExercise!.german);
            setValidation({ ...result, transcription });
            if (result.isCorrect) confetti();
          } catch (err) {
            console.error(err);
          } finally {
            setLoading(false);
          }
        };
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  // --- Scramble Mode ---
  const toggleWord = (word: string, index: number) => {
    const key = `${word}-${index}`;
    if (userAnswer.includes(key)) {
      setUserAnswer(userAnswer.filter(w => w !== key));
    } else {
      setUserAnswer([...userAnswer, key]);
    }
  };

  const checkScramble = async () => {
    const translation = userAnswer.map(w => w.split('-')[0]).join(' ');
    setLoading(true);
    try {
      const result = await validateTranslation(sessionConfig!.topic, currentExercise!.english, translation, currentExercise!.german);
      setValidation(result);
      if (result.isCorrect) confetti();
    } finally {
      setLoading(false);
    }
  };

  // --- One-by-One Mode ---
  const selectWord = async (word: string) => {
    const newAnswer = [...userAnswer, word];
    setUserAnswer(newAnswer);
    
    if (currentStep + 1 < currentExercise!.words.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      try {
        const result = await validateTranslation(sessionConfig!.topic, currentExercise!.english, newAnswer.join(' '), currentExercise!.german);
        setValidation(result);
        if (result.isCorrect) confetti();
      } finally {
        setLoading(false);
      }
    }
  };

  const removeLastWord = () => {
    if (userAnswer.length > 0 && !validation && !loading) {
      setUserAnswer(userAnswer.slice(0, -1));
      setCurrentStep(prev => Math.max(0, prev - 1));
    }
  };

  if (!sessionConfig) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 font-sans">
        {settingsModal}
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
              onClick={() => setShowSettings(true)}
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
                onClick={() => setShowSettings(true)}
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
            onChange={(e) => setTopic(e.target.value)}
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
                <button
                  onClick={() => setTopic(t)}
                  className="pl-3 py-1"
                >
                  {t}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentTopic(t);
                    setRecentTopics(getRecentTopics());
                    if (topic === t) setTopic('');
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
                onClick={() => setTopic(t)}
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
            onChange={(e) => setTotalExercises(parseInt(e.target.value))}
            className="w-full px-6 py-4 bg-[#141414] border-none rounded-2xl text-xl mb-8 focus:ring-2 focus:ring-[#8A8A60] outline-none transition-all text-[#E5E5E0]"
          />

          <button 
            onClick={startSession}
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

  if (isRuleReview && sessionConfig?.ruleInfo) {
    const { ruleInfo } = sessionConfig;
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 font-sans">
        {settingsModal}
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
            <button onClick={() => setSessionConfig(null)} className="text-[#9A9A80] hover:text-[#E5E5E0]">Cancel</button>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-10">
            <div>
              <h3 className="text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-4">Cheat Sheet</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-sm mb-1 text-[#E5E5E0]">Use Cases</p>
                  <ul className="list-disc list-inside text-[#9A9A80] text-sm space-y-1">
                    {ruleInfo.cheatSheet.useCases.map((u, i) => <li key={i}>{u}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-bold text-sm mb-1 text-[#E5E5E0]">Nuances</p>
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
            <h3 className="text-sm font-bold text-[#9A9A80] uppercase tracking-widest mb-2">Exercise Design</h3>
            <p className="text-sm text-[#9A9A80] mb-2"><strong className="text-[#E5E5E0]">Focus:</strong> {ruleInfo.exerciseDesign.focusAreas.join(', ')}</p>
            <p className="text-sm text-[#9A9A80]"><strong className="text-[#E5E5E0]">Progression:</strong> {ruleInfo.exerciseDesign.difficultyProgression}</p>
          </div>

          <button 
            onClick={startExercises}
            disabled={loading}
            className="w-full py-4 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Start Exercises"}
          </button>
        </motion.div>
      </div>
    );
  }

  if (isSessionComplete) {
    const score = results.filter(r => r.validation.isCorrect).length;
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center p-6 font-sans">
        {settingsModal}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-[#1A1A1A] rounded-[32px] p-10 shadow-xl border border-[#2A2A2A] text-center"
        >
          <Trophy size={64} className="text-[#8A8A60] mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-2 text-[#E5E5E0]">Session Complete!</h2>
          <p className="text-xl text-[#9A9A80] mb-8">You scored {score} out of {sessionConfig.totalExercises}</p>
          
          <button 
            onClick={() => setSessionConfig(null)}
            className="w-full py-4 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] transition-colors"
          >
            Start New Session
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 font-sans text-[#E5E5E0]">
      {settingsModal}
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSessionConfig(null)}>
            <div className="w-10 h-10 bg-[#8A8A60] rounded-full flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            <span className="font-bold text-xl">German Tutor</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] text-[#9A9A80] hover:bg-[#252525] transition-all"
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button 
              onClick={() => setShowHelp(!showHelp)}
              className={cn(
                "p-2 rounded-full transition-all",
                showHelp ? "bg-[#8A8A60] text-white" : "bg-[#1A1A1A] border border-[#2A2A2A] text-[#9A9A80] hover:bg-[#252525]"
              )}
              title="Grammar Help"
            >
              <HelpCircle size={20} />
            </button>
            <span className="px-4 py-2 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] text-sm font-medium text-[#9A9A80]">
              {sessionConfig.topic}
            </span>
            <span className="px-4 py-2 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] text-sm font-medium text-[#9A9A80]">
              {currentExerciseIndex + 1} / {sessionConfig.totalExercises}
            </span>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-[#2A2A2A] rounded-full mb-8 overflow-hidden">
          <motion.div 
            className={cn("h-full", validation ? (validation.isCorrect ? "bg-green-500" : "bg-red-500") : "bg-[#8A8A60]")}
            initial={{ width: `${(currentExerciseIndex / sessionConfig.totalExercises) * 100}%` }}
            animate={{ width: `${((currentExerciseIndex + (validation ? 1 : 0)) / sessionConfig.totalExercises) * 100}%` }}
          />
        </div>

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && sessionConfig.ruleInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-[#8A8A60] text-white rounded-[32px] p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold">Grammar Help: {sessionConfig.ruleInfo.title}</h3>
                  <button onClick={() => setShowHelp(false)} className="opacity-60 hover:opacity-100">Close</button>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <p className="font-bold mb-2 text-sm uppercase tracking-widest opacity-70">Cheat Sheet</p>
                    <div className="space-y-4">
                      <div>
                        <p className="font-bold text-sm">Use Cases</p>
                        <ul className="list-disc list-inside text-sm opacity-90">
                          {sessionConfig.ruleInfo.cheatSheet.useCases.map((u, i) => <li key={i}>{u}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-sm">Nuances</p>
                        <ul className="list-disc list-inside text-sm opacity-90">
                          {sessionConfig.ruleInfo.cheatSheet.nuances.map((n, i) => <li key={i}>{n}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold mb-2 text-sm uppercase tracking-widest opacity-70">Examples</p>
                    <div className="space-y-3">
                      {sessionConfig.ruleInfo.cheatSheet.examples.map((ex, i) => (
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
          )}
        </AnimatePresence>

        {/* Exercise Card */}
        <motion.div 
          key={currentExercise?.english}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1A1A1A] rounded-[32px] p-8 shadow-lg border border-[#2A2A2A] mb-6"
        >
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-[#9A9A80] opacity-60 font-sans font-bold">Translate</span>
            <h2 className="text-4xl font-medium mt-2 leading-tight text-[#E5E5E0]">
              {currentExercise?.english}
            </h2>
          </div>

          <div className="flex gap-2 mb-10 p-1 bg-[#141414] rounded-2xl w-fit">
            {[
              { id: 'speech', icon: Mic, label: 'Speech' },
              { id: 'scramble', icon: LayoutGrid, label: 'Scramble' },
              { id: 'one-by-one', icon: ChevronRight, label: 'One-by-One' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id as Mode)}
                disabled={loading || !!validation}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all",
                  mode === m.id ? "bg-[#252525] shadow-sm text-[#E5E5E0]" : "text-[#9A9A80] hover:text-[#E5E5E0]",
                  (loading || !!validation) && "opacity-50 cursor-not-allowed"
                )}
              >
                <m.icon size={18} />
                {m.label}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              {mode === 'speech' && (
                <motion.div 
                  key="speech"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center justify-center gap-6 py-10"
                >
                  <button
                    onMouseDown={!loading && !validation ? startRecording : undefined}
                    onMouseUp={!loading && !validation ? stopRecording : undefined}
                    onMouseLeave={!loading && !validation ? stopRecording : undefined}
                    onTouchStart={!loading && !validation ? startRecording : undefined}
                    onTouchEnd={!loading && !validation ? stopRecording : undefined}
                    className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
                      (loading || !!validation) ? "opacity-50 cursor-not-allowed bg-gray-700" : (isRecording 
                        ? "bg-red-500 scale-110 shadow-[0_0_30px_rgba(239,68,68,0.4)]" 
                        : "bg-[#8A8A60] hover:bg-[#9A9A70] shadow-lg")
                    )}
                  >
                    {isRecording ? <MicOff size={32} className="text-white" /> : <Mic size={32} className="text-white" />}
                  </button>
                  <p className="text-[#9A9A80] italic">
                    {isRecording ? "Listening..." : "Hold to speak in German"}
                  </p>
                </motion.div>
              )}

              {mode === 'scramble' && (
                <motion.div 
                  key="scramble"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="min-h-[80px] p-4 bg-[#141414] rounded-2xl flex flex-wrap gap-3 mb-8 border-2 border-dashed border-[#2A2A2A]">
                    {userAnswer.map((item, i) => {
                      const word = item.split('-')[0];
                      return (
                        <button
                          key={item}
                          disabled={loading || !!validation}
                          onClick={() => toggleWord(word, parseInt(item.split('-')[1]))}
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
                          disabled={isUsed || loading || !!validation}
                          onClick={() => toggleWord(word, i)}
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
                    onClick={checkScramble}
                    disabled={userAnswer.length === 0 || loading || !!validation}
                    className="w-full py-4 bg-[#8A8A60] text-white rounded-2xl font-bold hover:bg-[#9A9A70] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "Check Answer"}
                  </button>
                </motion.div>
              )}

              {mode === 'one-by-one' && (
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
                    {userAnswer.length > 0 && !validation && !loading && (
                      <button 
                        onClick={removeLastWord}
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
                        onClick={() => selectWord(candidate)}
                        disabled={loading || !!validation}
                        className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl hover:border-[#8A8A60] hover:shadow-md transition-all text-lg text-center text-[#E5E5E0] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {candidate}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Feedback Section */}
        <AnimatePresence>
          {validation && (
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
                    <p className="text-sm opacity-70 italic mb-2 text-[#E5E5E0]">You said: "{validation.transcription}"</p>
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
                onClick={() => nextExercise(validation)}
                className="mt-8 w-full py-4 bg-[#E5E5E0] text-[#0F0F0F] rounded-2xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                Next Exercise
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
