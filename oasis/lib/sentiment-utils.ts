import Sentiment from 'sentiment';

const sentiment = new Sentiment();

export interface SentimentResult {
  score: number; // Range: -5 to 5 (negative to positive)
  comparative: number; // Normalized score: -1 to 1
  calculation: Array<{ [word: string]: number }>;
  tokens: string[];
  words: string[];
  positive: string[];
  negative: string[];
}

export interface SentimentAnalysis {
  score: number;
  comparative: number;
  label: 'positive' | 'neutral' | 'negative';
  magnitude: 'low' | 'medium' | 'high';
}

/**
 * Analyze sentiment of a text message
 * @param text The text to analyze
 * @returns Sentiment analysis result
 */
export function analyzeSentiment(text: string): SentimentAnalysis {
  const result: SentimentResult = sentiment.analyze(text) as SentimentResult;
  
  // Determine label based on score
  let label: 'positive' | 'neutral' | 'negative';
  if (result.comparative > 0.1) {
    label = 'positive';
  } else if (result.comparative < -0.1) {
    label = 'negative';
  } else {
    label = 'neutral';
  }
  
  // Determine magnitude based on absolute comparative score
  const absComparative = Math.abs(result.comparative);
  let magnitude: 'low' | 'medium' | 'high';
  if (absComparative < 0.2) {
    magnitude = 'low';
  } else if (absComparative < 0.5) {
    magnitude = 'medium';
  } else {
    magnitude = 'high';
  }
  
  return {
    score: result.score,
    comparative: result.comparative,
    label,
    magnitude,
  };
}

/**
 * Check if sentiment indicates escalation is needed
 * @param sentimentAnalysis The sentiment analysis result
 * @returns true if escalation should be considered
 */
export function shouldEscalateBySentiment(sentimentAnalysis: SentimentAnalysis): boolean {
  // Escalate if sentiment is highly negative
  return (
    sentimentAnalysis.label === 'negative' &&
    sentimentAnalysis.magnitude === 'high'
  );
}

/**
 * Get sentiment emoji for display
 * @param label Sentiment label
 * @returns Emoji string
 */
export function getSentimentEmoji(label: 'positive' | 'neutral' | 'negative'): string {
  switch (label) {
    case 'positive':
      return '😊';
    case 'negative':
      return '😞';
    case 'neutral':
      return '😐';
    default:
      return '😐';
  }
}

/**
 * Get sentiment color class for Tailwind CSS
 * @param label Sentiment label
 * @returns Tailwind color class
 */
export function getSentimentColor(label: 'positive' | 'neutral' | 'negative'): string {
  switch (label) {
    case 'positive':
      return 'text-green-600 dark:text-green-400';
    case 'negative':
      return 'text-red-600 dark:text-red-400';
    case 'neutral':
      return 'text-gray-600 dark:text-gray-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

