import { v4 as uuidv4 } from 'uuid';
import { MockDatabase } from '../db/schema.js';

type AlertType = 'mass_data_export' | 'off_hours_access' | 'privilege_escalation' | 'unusual_tcode' | 'transport_anomaly';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface BehaviorEvent {
  user_id?: string;
  user_name: string;
  source_system?: string;
  activity?: string;
  tcode?: string;
  export_mb?: number;
  role_changes?: number;
  transport_id?: string;
  occurred_at?: string;
}

export class BehavioralAnomalyService {
  constructor(private db: MockDatabase) {}

  ingestEvents(projectId: string, events: BehaviorEvent[]) {
    const alerts = events
      .map((event) => this.scoreEvent(event))
      .filter((scored) => scored.riskScore >= 40)
      .map((scored) => this.insertAlert(projectId, scored));

    return {
      eventsProcessed: events.length,
      alertsCreated: alerts.length,
      alerts
    };
  }

  private scoreEvent(event: BehaviorEvent) {
    const occurredAt = event.occurred_at ? new Date(event.occurred_at) : new Date();
    const hour = occurredAt.getHours();
    let riskScore = 0;
    const reasons: string[] = [];
    let alertType: AlertType = 'unusual_tcode';

    if (hour < 6 || hour > 22) {
      riskScore += 25;
      alertType = 'off_hours_access';
      reasons.push('off-hours activity');
    }

    if ((event.export_mb || 0) >= 10240) {
      riskScore += 40;
      alertType = 'mass_data_export';
      reasons.push(`${event.export_mb}MB export volume`);
    }

    if ((event.role_changes || 0) > 0) {
      riskScore += 35;
      alertType = 'privilege_escalation';
      reasons.push(`${event.role_changes} role change(s)`);
    }

    if (event.transport_id) {
      riskScore += 25;
      alertType = 'transport_anomaly';
      reasons.push(`transport activity ${event.transport_id}`);
    }

    if (event.tcode && ['SE38', 'SA38', 'SE37', 'SM59', 'SU01', 'PFCG', 'SE16N'].includes(event.tcode.toUpperCase())) {
      riskScore += 25;
      alertType = 'unusual_tcode';
      reasons.push(`sensitive transaction ${event.tcode}`);
    }

    riskScore = Math.min(riskScore, 100);

    return {
      event,
      occurredAt: occurredAt.toISOString(),
      alertType,
      riskScore,
      severity: this.getSeverity(riskScore),
      reasons
    };
  }

  private insertAlert(projectId: string, scored: ReturnType<BehavioralAnomalyService['scoreEvent']>) {
    const event = scored.event;
    const alert = {
      id: uuidv4(),
      project_id: projectId,
      user_id: event.user_id || null,
      user_name: event.user_name,
      alert_type: scored.alertType,
      severity: scored.severity,
      source_system: event.source_system || 'SAP',
      activity: event.activity || event.tcode || scored.alertType,
      risk_score: scored.riskScore,
      details: `Runtime anomaly detected: ${scored.reasons.join(', ') || 'activity exceeded baseline threshold'}.`,
      status: 'open',
      occurred_at: scored.occurredAt
    };

    this.db.prepare(`INSERT INTO behavioral_alerts (id, project_id, user_id, user_name, alert_type, severity, source_system, activity, risk_score, details, status, occurred_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      alert.id,
      alert.project_id,
      alert.user_id,
      alert.user_name,
      alert.alert_type,
      alert.severity,
      alert.source_system,
      alert.activity,
      alert.risk_score,
      alert.details,
      alert.status,
      alert.occurred_at
    );

    return alert;
  }

  private getSeverity(score: number): Severity {
    if (score >= 85) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}
