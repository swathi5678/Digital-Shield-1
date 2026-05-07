import { useState, useCallback } from 'react';
import axios from 'axios';
export function useAIAnalysis() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const analyze = useCallback(async (mode, context) => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/ai/analyze', {
                mode,
                context
            }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setResult(response.data.analysis);
        }
        catch (err) {
            const axiosError = err;
            if (axiosError.response?.status === 503) {
                setError('AI service unavailable. Configure your OPENAI_API_KEY.');
            }
            else if (axiosError.response?.status === 401) {
                setError('Authentication failed. Please log in again.');
            }
            else {
                setError('Analysis failed. Please try again.');
            }
        }
        finally {
            setLoading(false);
        }
    }, []);
    return { analyze, result, loading, error };
}
