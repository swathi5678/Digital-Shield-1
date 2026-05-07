import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { VSESummary, VSEFinding, VSEChangeEvent, VSEHandoverReport, VSEMonitoring } from '../types/security.types.js';

export function useVSEData(projectId: string) {
  const [summary, setSummary] = useState<VSESummary | null>(null);
  const [findings, setFindings] = useState<VSEFinding[]>([]);
  const [changeEvents, setChangeEvents] = useState<VSEChangeEvent[]>([]);
  const [handover, setHandover] = useState<VSEHandoverReport | null>(null);
  const [monitoring, setMonitoring] = useState<VSEMonitoring[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/projects/${projectId}/vse/summary`, { headers: { Authorization: `Bearer ${token}` } });
      setSummary(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch summary');
    }
  }, [projectId]);

  const fetchFindings = useCallback(async (filters = {}) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/projects/${projectId}/vse/findings`, { headers: { Authorization: `Bearer ${token}` }, params: filters });
      setFindings(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch findings');
    }
  }, [projectId]);

  const fetchChangeEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/projects/${projectId}/vse/change-events`, { headers: { Authorization: `Bearer ${token}` } });
      setChangeEvents(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch change events');
    }
  }, [projectId]);

  const fetchHandover = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/projects/${projectId}/vse/handover`, { headers: { Authorization: `Bearer ${token}` } });
      setHandover(res.data || null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch handover report');
    }
  }, [projectId]);

  const fetchMonitoring = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/projects/${projectId}/vse/monitoring`, { headers: { Authorization: `Bearer ${token}` } });
      setMonitoring(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch monitoring');
    }
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSummary(), fetchFindings(), fetchChangeEvents(), fetchHandover(), fetchMonitoring()]).finally(() => setLoading(false));
  }, [projectId]);

  const updateFindingStatus = async (findingId: string, status: string) => {
    const token = localStorage.getItem('token');
    await axios.patch(`/api/projects/${projectId}/vse/findings/${findingId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchFindings();
    await fetchSummary();
  };

  const triggerScan = async (scan_type: string, object?: string) => {
    const token = localStorage.getItem('token');
    const res = await axios.post(`/api/projects/${projectId}/vse/trigger-scan`, { scan_type, object }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchFindings();
    await fetchSummary();
    return res.data;
  };

  const advanceHandoverStatus = async (status: string, signed_off_by?: string) => {
    const token = localStorage.getItem('token');
    await axios.patch(`/api/projects/${projectId}/vse/handover/status`, { status, signed_off_by }, { headers: { Authorization: `Bearer ${token}` } });
    await fetchHandover();
  };

  return {
    summary,
    findings,
    changeEvents,
    handover,
    monitoring,
    loading,
    error,
    refetchFindings: fetchFindings,
    updateFindingStatus,
    triggerScan,
    advanceHandoverStatus
  };
}
