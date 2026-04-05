import { useState, useCallback } from 'react';

const RECENT_TOPICS_KEY = 'germanTutor_recentTopics';
const MAX_RECENT = 10;

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

export function useRecentTopics() {
  const [recentTopics, setRecentTopics] = useState<string[]>(getRecentTopics);

  const addTopic = useCallback((topic: string) => {
    saveRecentTopic(topic);
    setRecentTopics(getRecentTopics());
  }, []);

  const removeTopic = useCallback((topic: string) => {
    removeRecentTopic(topic);
    setRecentTopics(getRecentTopics());
  }, []);

  return { recentTopics, addTopic, removeTopic };
}
