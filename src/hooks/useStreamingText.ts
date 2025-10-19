/**
 * Custom hook for ChatGPT-style streaming text animation
 */
import { useState, useEffect, useCallback } from 'react';

interface UseStreamingTextOptions {
  speed?: number; // milliseconds between words
  onComplete?: () => void;
}

export function useStreamingText(
  fullText: string,
  options: UseStreamingTextOptions = {}
) {
  const { speed = 30, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!fullText) {
      setIsComplete(true);
      return;
    }

    // Reset when fullText changes
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [fullText]);

  useEffect(() => {
    if (!fullText || isComplete) return;

    const words = fullText.split(' ');

    if (currentIndex >= words.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText((prev) => {
        const separator = currentIndex === 0 ? '' : ' ';
        return prev + separator + words[currentIndex];
      });
      setCurrentIndex((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timer);
  }, [fullText, currentIndex, isComplete, speed, onComplete]);

  const skipAnimation = useCallback(() => {
    setDisplayedText(fullText);
    setIsComplete(true);
    onComplete?.();
  }, [fullText, onComplete]);

  return { displayedText, isComplete, skipAnimation };
}

/**
 * Alternative character-by-character streaming
 */
export function useStreamingTextChar(
  fullText: string,
  options: UseStreamingTextOptions = {}
) {
  const { speed = 20, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setIsComplete(true);
      return;
    }

    // Reset
    setDisplayedText('');
    setIsComplete(false);

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.substring(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        onComplete?.();
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [fullText, speed, onComplete]);

  const skipAnimation = useCallback(() => {
    setDisplayedText(fullText);
    setIsComplete(true);
    onComplete?.();
  }, [fullText, onComplete]);

  return { displayedText, isComplete, skipAnimation };
}
