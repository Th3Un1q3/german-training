import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Settings, HelpCircle, Mic, LayoutGrid, ChevronRight, Loader2 } from 'lucide-react';
import { GitHubLink } from './GitHubLink';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';
import { validateTranslation, transcribeAudio } from '../lib/gemini';
import { Exercise, Mode, ValidationResult, SessionConfig, SessionResult } from '../types';
import { HelpPanel } from './HelpPanel';
import { Feedback } from './Feedback';
import { SpeechMode } from './modes/SpeechMode';
import { ScrambleMode } from './modes/ScrambleMode';
import { OneByOneMode } from './modes/OneByOneMode';

interface ExerciseViewProps {
  sessionConfig: SessionConfig;
  currentExercise: Exercise;
  currentExerciseIndex: number;
  results: SessionResult[];
  loading: boolean;
  validation: ValidationResult | null;
  onSetValidation: (v: ValidationResult | null) => void;
  onNextExercise: (v: ValidationResult) => void;
  onResetSession: () => void;
  onShowSettings: () => void;
}

export function ExerciseView({
  sessionConfig, currentExercise, currentExerciseIndex, results, loading, validation,
  onSetValidation, onNextExercise, onResetSession, onShowSettings,
}: ExerciseViewProps) {
  const [mode, setMode] = useState<Mode>('scramble');
  const [userAnswer, setUserAnswer] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [validating, setValidating] = useState(false);
  const [scrambledWords, setScrambledWords] = useState<string[]>([]);
  const [shuffledCandidates, setShuffledCandidates] = useState<string[][]>([]);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const mediaStream = useRef<MediaStream | null>(null);

  const busy = loading || validating;

  // Reset local state when a new exercise loads
  useEffect(() => {
    setUserAnswer([]);
    setCurrentStep(0);
    setScrambledWords([...currentExercise.words].sort(() => Math.random() - 0.5));
    setShuffledCandidates(currentExercise.candidates.map(c => [...c].sort(() => Math.random() - 0.5)));
  }, [currentExercise]);

  // Clean up mic stream on unmount or mode change
  useEffect(() => {
    return () => {
      mediaStream.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    onSetValidation(null);
    setUserAnswer([]);
    setCurrentStep(0);
    setScrambledWords([...currentExercise.words].sort(() => Math.random() - 0.5));
  };

  // --- Speech ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => audioChunks.current.push(e.data);

      mediaRecorder.current.onstop = async () => {
        // Release the mic immediately when recording stops
        mediaStream.current?.getTracks().forEach(t => t.stop());
        mediaStream.current = null;

        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          setValidating(true);
          try {
            const transcription = await transcribeAudio(base64);
            const result = await validateTranslation(
              sessionConfig.topic, currentExercise.english, transcription, currentExercise.german,
            );
            onSetValidation({ ...result, transcription });
            if (result.isCorrect) confetti();
          } catch (err) {
            console.error(err);
          } finally {
            setValidating(false);
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
    // Safety: ensure stream is released even if onstop hasn't fired yet
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(t => t.stop());
    }
  };

  // --- Scramble ---
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
    setValidating(true);
    try {
      const result = await validateTranslation(
        sessionConfig.topic, currentExercise.english, translation, currentExercise.german,
      );
      onSetValidation(result);
      if (result.isCorrect) confetti();
    } finally {
      setValidating(false);
    }
  };

  // --- One-by-One ---
  const selectWord = async (word: string) => {
    const newAnswer = [...userAnswer, word];
    setUserAnswer(newAnswer);

    if (currentStep + 1 < currentExercise.words.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setValidating(true);
      try {
        const result = await validateTranslation(
          sessionConfig.topic, currentExercise.english, newAnswer.join(' '), currentExercise.german,
        );
        onSetValidation(result);
        if (result.isCorrect) confetti();
      } finally {
        setValidating(false);
      }
    }
  };

  const removeLastWord = () => {
    if (userAnswer.length > 0 && !validation && !busy) {
      setUserAnswer(userAnswer.slice(0, -1));
      setCurrentStep(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] p-6 font-sans text-[#E5E5E0]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={onResetSession}>
            <div className="w-10 h-10 bg-[#8A8A60] rounded-full flex items-center justify-center text-white flex-shrink-0">
              <BookOpen size={20} />
            </div>
            <span className="hidden sm:inline font-bold text-xl">German Tutor</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <span className="hidden sm:inline-flex"><GitHubLink /></span>
            <button
              onClick={onShowSettings}
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
            <span className="hidden sm:inline-flex px-4 py-2 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] text-sm font-medium text-[#9A9A80]">
              {sessionConfig.topic}
            </span>
            <span className="px-4 py-2 bg-[#1A1A1A] rounded-full border border-[#2A2A2A] text-sm font-medium text-[#9A9A80]">
              {currentExerciseIndex + 1} / {sessionConfig.totalExercises}
            </span>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="flex gap-1 w-full mb-8">
          {Array.from({ length: sessionConfig.totalExercises }, (_, i) => {
            let bg = 'bg-[#2A2A2A]';
            if (i < results.length) {
              bg = results[i].validation.isCorrect ? 'bg-green-500' : 'bg-red-500';
            } else if (i === currentExerciseIndex) {
              bg = validation
                ? (validation.isCorrect ? 'bg-green-500' : 'bg-red-500')
                : 'bg-[#8A8A60]';
            }
            return (
              <div
                key={i}
                className={cn('h-2 rounded-full flex-1 transition-colors duration-300', bg)}
              />
            );
          })}
        </div>

        {/* Help Panel */}
        <AnimatePresence>
          {showHelp && sessionConfig.ruleInfo && (
            <HelpPanel ruleInfo={sessionConfig.ruleInfo} onClose={() => setShowHelp(false)} />
          )}
        </AnimatePresence>

        {/* Exercise Card */}
        <motion.div
          key={currentExercise.english}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "rounded-[32px] p-8 shadow-lg border mb-6 transition-colors duration-300",
            validation
              ? validation.isCorrect
                ? "bg-[#1A1A1A] border-green-800"
                : "bg-[#1A1A1A] border-red-800"
              : "bg-[#1A1A1A] border-[#2A2A2A]"
          )}
        >
          <div className="mb-8">
            <span className="text-xs uppercase tracking-widest text-[#9A9A80] opacity-60 font-sans font-bold">Translate to German</span>
            <h2 className="text-4xl font-medium mt-2 leading-tight text-[#E5E5E0]">
              {currentExercise.english}
            </h2>
          </div>

          <AnimatePresence mode="wait">
            {validation ? (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Feedback
                  validation={validation}
                  userAnswer={
                    validation.transcription
                    || (mode === 'scramble'
                      ? userAnswer.map(w => w.split('-')[0]).join(' ')
                      : userAnswer.join(' '))
                  }
                  onNext={() => onNextExercise(validation)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="interaction"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex gap-2 mb-10 p-1 bg-[#141414] rounded-2xl w-full sm:w-fit">
                  {([
                    { id: 'speech' as Mode, icon: Mic, label: 'Speech' },
                    { id: 'scramble' as Mode, icon: LayoutGrid, label: 'Word Order' },
                    { id: 'one-by-one' as Mode, icon: ChevronRight, label: 'Word Pick' },
                  ]).map(m => (
                    <button
                      key={m.id}
                      onClick={() => handleModeChange(m.id)}
                      disabled={busy}
                      className={cn(
                        "flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all",
                        mode === m.id ? "bg-[#252525] shadow-sm text-[#E5E5E0]" : "text-[#9A9A80] hover:text-[#E5E5E0]",
                        busy && "opacity-50 cursor-not-allowed"
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
                      <SpeechMode
                        isRecording={isRecording}
                        disabled={busy}
                        onToggleRecording={isRecording ? stopRecording : startRecording}
                      />
                    )}
                    {mode === 'scramble' && (
                      <ScrambleMode
                        scrambledWords={scrambledWords}
                        userAnswer={userAnswer}
                        disabled={busy}
                        onToggleWord={toggleWord}
                        onCheck={checkScramble}
                      />
                    )}
                    {mode === 'one-by-one' && (
                      <OneByOneMode
                        userAnswer={userAnswer}
                        shuffledCandidates={shuffledCandidates}
                        currentStep={currentStep}
                        disabled={busy}
                        onSelectWord={selectWord}
                        onRemoveLastWord={removeLastWord}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Checking indicator */}
                <AnimatePresence>
                  {validating && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-center gap-3 py-6 text-[#9A9A80]"
                    >
                      <Loader2 className="animate-spin" size={20} />
                      <span className="text-sm font-medium">Checking your answer…</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
