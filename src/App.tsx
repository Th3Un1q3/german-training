import { useState, useEffect, useRef } from 'react';
import { generateExercise, generateRuleInfo, getStoredApiKey, setStoredApiKey, getStoredModel, setStoredModel, getStoredBaseUrl, setStoredBaseUrl, listAvailableModels } from './lib/gemini';
import { Exercise, ValidationResult, SessionConfig, SessionResult } from './types';
import { useRecentTopics } from './hooks/useRecentTopics';
import { SettingsModal } from './components/SettingsModal';
import { StartScreen } from './components/StartScreen';
import { RuleReview } from './components/RuleReview';
import { SessionComplete } from './components/SessionComplete';
import { ExerciseView } from './components/ExerciseView';

export default function App() {
  // --- Session state ---
  const [topic, setTopic] = useState('');
  const [totalExercises, setTotalExercises] = useState(10);
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [usedSentences, setUsedSentences] = useState<string[]>([]);
  const [isRuleReview, setIsRuleReview] = useState(false);

  // --- Exercise queue ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exerciseQueue, setExerciseQueue] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // --- Settings ---
  const [showSettings, setShowSettings] = useState(false);
  const [settingsApiKey, setSettingsApiKey] = useState(getStoredApiKey);
  const [settingsModel, setSettingsModel] = useState(getStoredModel);
  const [settingsBaseUrl, setSettingsBaseUrl] = useState(getStoredBaseUrl);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);

  const { recentTopics, addTopic, removeTopic } = useRecentTopics();

  // Tracks the in-flight background preload promise (null when idle).
  // Storing the promise (rather than a boolean flag) lets fallback paths await
  // it directly instead of firing a duplicate request.
  const preloadPromiseRef = useRef<Promise<Exercise[]> | null>(null);

  // --- Helpers ---
  const resetSession = () => {
    setSessionConfig(null);
    setResults([]);
    setCurrentExerciseIndex(0);
    setIsSessionComplete(false);
    setUsedSentences([]);
    setExerciseQueue([]);
    setCurrentExercise(null);
    setValidation(null);
    setIsRuleReview(false);
    setError(null);
  };

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

  // --- Settings ---
  const fetchModels = async (apiKey?: string) => {
    if (apiKey !== undefined) setStoredApiKey(apiKey);
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
    if (showSettings) fetchModels();
  }, [showSettings]);

  // --- Preloading ---
  // How many exercises to keep loaded and ready ahead of the user.
  const PRELOAD_BUFFER = 3;

  // Trigger a background fetch only when the number of loaded-but-unanswered
  // exercises (current + queue) is below the buffer OR below what's needed to
  // finish the session — whichever is smaller.
  const triggerPreload = (currentQueue: Exercise[], used: string[]) => {
    if (preloadPromiseRef.current !== null || !sessionConfig) return;

    const answered = results.length; // exercises already completed
    const remaining = sessionConfig.totalExercises - answered;
    // +1 for the current exercise shown to the user (not yet in results)
    const loadedAhead = (currentExercise ? 1 : 0) + currentQueue.length;
    const needed = Math.min(PRELOAD_BUFFER, remaining) - loadedAhead;

    if (needed <= 0) return;

    // Always fetch a full PRELOAD_BUFFER batch (capped at remaining) so we
    // don't make many tiny single-exercise fetches when the buffer is nearly full.
    const batchSize = Math.min(PRELOAD_BUFFER, remaining);

    const promise = generateExercise(sessionConfig.topic, used, batchSize, sessionConfig.ruleInfo);
    preloadPromiseRef.current = promise;

    promise
      .then(exercises => {
        setExerciseQueue(q => [...q, ...exercises]);
        setUsedSentences(prev => [...new Set([...prev, ...exercises.map(e => e.english)])]);
      })
      .catch(() => {}) // silent — demand-path fallbacks handle errors
      .finally(() => { preloadPromiseRef.current = null; });
  };

  // Preload while the user reads the rule review page
  useEffect(() => {
    if (!isRuleReview || !sessionConfig) return;
    triggerPreload(exerciseQueue, usedSentences);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRuleReview]);

  // Preload next exercises as soon as feedback is shown (user is reading result)
  useEffect(() => {
    if (!validation || !sessionConfig) return;
    triggerPreload(exerciseQueue, usedSentences);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation]);

  const saveSettings = () => {
    setStoredApiKey(settingsApiKey);
    setStoredModel(settingsModel);
    setStoredBaseUrl(settingsBaseUrl);
    setShowSettings(false);
    setError(null);
  };

  // --- Session lifecycle ---
  const startSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await generateRuleInfo(topic);
      addTopic(topic);
      setSessionConfig({ topic, totalExercises, ruleInfo: info });
      setIsRuleReview(true);
    } catch (error: any) {
      handleApiError(error, "Failed to load grammar rules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startExercises = async () => {
    setError(null);
    setResults([]);
    setCurrentExerciseIndex(0);
    setIsSessionComplete(false);

    if (exerciseQueue.length > 0) {
      // Preloaded during rule review — instant start, no spinner
      const [first, ...rest] = exerciseQueue;
      setIsRuleReview(false);
      setCurrentExercise(first);
      setExerciseQueue(rest);
    } else {
      // Preload didn't finish in time — stay on rule review with loading spinner
      // until exercises are ready to avoid a blank screen flash.
      // Await the in-flight preload if one exists rather than firing a duplicate request.
      setLoading(true);
      try {
        const exercises = preloadPromiseRef.current
          ? await preloadPromiseRef.current
          : await generateExercise(topic, usedSentences, 3, sessionConfig?.ruleInfo);
        setIsRuleReview(false);
        setCurrentExercise(exercises[0]);
        setExerciseQueue(exercises.slice(1));
        setUsedSentences(prev => [...new Set([...prev, ...exercises.map(e => e.english)])]);
      } catch (error: any) {
        handleApiError(error, "Failed to load exercises. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const nextExercise = async (validationResult: ValidationResult) => {
    const newResults = [...results, { exercise: currentExercise!, validation: validationResult }];
    setResults(newResults);

    if (newResults.length >= sessionConfig!.totalExercises) {
      setIsSessionComplete(true);
    } else {
      setValidation(null);
      setCurrentExerciseIndex(prev => prev + 1);
      setError(null);

      const newQueue = [...exerciseQueue];
      if (newQueue.length > 0) {
        // Preloaded — advance instantly without any loading state
        setCurrentExercise(newQueue.shift()!);
        setExerciseQueue(newQueue);
      } else {
        // Preload didn't finish in time — generate now (fallback).
        // Await the in-flight preload if one exists rather than firing a duplicate request.
        setLoading(true);
        try {
          const exercises = preloadPromiseRef.current
            ? await preloadPromiseRef.current
            : await generateExercise(sessionConfig!.topic, usedSentences, 3, sessionConfig?.ruleInfo);
          setCurrentExercise(exercises[0]);
          setExerciseQueue(exercises.slice(1));
          setUsedSentences(prev => [...new Set([...prev, ...exercises.map(e => e.english)])]);
        } catch (error: any) {
          handleApiError(error, "Failed to load exercises. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // --- Render ---
  const settingsModal = showSettings ? (
    <SettingsModal
      apiKey={settingsApiKey}
      model={settingsModel}
      baseUrl={settingsBaseUrl}
      availableModels={availableModels}
      modelsLoading={modelsLoading}
      onApiKeyChange={setSettingsApiKey}
      onModelChange={setSettingsModel}
      onBaseUrlChange={setSettingsBaseUrl}
      onSave={saveSettings}
      onClose={() => setShowSettings(false)}
    />
  ) : null;

  if (!sessionConfig) {
    return (
      <>
        {settingsModal}
        <StartScreen
          topic={topic}
          totalExercises={totalExercises}
          loading={loading}
          error={error}
          recentTopics={recentTopics}
          onTopicChange={setTopic}
          onTotalExercisesChange={setTotalExercises}
          onStart={startSession}
          onRemoveTopic={removeTopic}
          onShowSettings={() => setShowSettings(true)}
        />
      </>
    );
  }

  if (isRuleReview && sessionConfig.ruleInfo) {
    return (
      <>
        {settingsModal}
        <RuleReview
          ruleInfo={sessionConfig.ruleInfo}
          loading={loading}
          onStart={startExercises}
          onCancel={resetSession}
        />
      </>
    );
  }

  if (isSessionComplete) {
    return (
      <>
        {settingsModal}
        <SessionComplete
          sessionConfig={sessionConfig}
          results={results}
          onNewSession={resetSession}
        />
      </>
    );
  }

  if (!currentExercise) return null;

  return (
    <>
      {settingsModal}
      <ExerciseView
        sessionConfig={sessionConfig}
        currentExercise={currentExercise}
        currentExerciseIndex={currentExerciseIndex}
        results={results}
        loading={loading}
        validation={validation}
        onSetValidation={setValidation}
        onNextExercise={nextExercise}
        onResetSession={resetSession}
        onShowSettings={() => setShowSettings(true)}
      />
    </>
  );
}
