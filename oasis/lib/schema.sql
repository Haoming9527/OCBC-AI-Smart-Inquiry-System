-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
  summary TEXT,
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  case_id VARCHAR(255) NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'bot')),
  text TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  sentiment_score NUMERIC,
  sentiment_comparative NUMERIC,
  sentiment_label VARCHAR(10) CHECK (sentiment_label IN ('positive', 'neutral', 'negative')),
  sentiment_magnitude VARCHAR(10) CHECK (sentiment_magnitude IN ('low', 'medium', 'high'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_timestamp ON cases(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_sentiment_label ON messages(sentiment_label);

