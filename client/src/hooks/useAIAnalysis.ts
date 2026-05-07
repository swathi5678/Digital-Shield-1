import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { AIAnalysisResponse } from '../types/security.types.js';

export function useAIAnalysis() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (mode: string, context: unknown) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post<AIAnalysisResponse>('/api/ai/analyze', {
        mode,
        context
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setResult(response.data.analysis);
    } catch (err) {
      const axiosError = err as AxiosError;
      if (axiosError.response?.status === 503) {
        setError('AI service unavailable. Configure your OPENAI_API_KEY.');
      } else if (axiosError.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, result, loading, error };
}
