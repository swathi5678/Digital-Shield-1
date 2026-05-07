import { v4 as uuidv4 } from 'uuid';
import { MockDatabase } from '../db/schema.js';

export interface AgrUser {
  uname: string;
  user_full_name?: string;
  user_type?: string;
  locked_status?: string;
}

export interface AgrTCode {
  role_name: string;
  tcode: string;
  tcode_description?: string;
  auth_object?: string;
}

export interface SoDViolation {
  id: string;
  violation_type: 'user_has_both_tcodes' | 'role_has_both_tcodes' | 'user_via_multiple_roles';
  severity: 'critical' | 'high' | 'medium' | 'low';
  tcode_1: string;
  tcode_2: string;
  user_name?: string;
  role_1?: string;
  role_2?: string;
  affected_user_count: number;
  rule_name: string;
  description: string;
  remediation_suggestion: string;
}

export interface DetectionRunResult {
  runId: string;
  usersCount: number;
  rolesCount: number;
  tcodesCount: number;
  violationsFound: number;
  violations: SoDViolation[];
}

export class SoDDetectionService {
  constructor(private db: MockDatabase) {}

  /**
   * Create a new detection run and store uploaded data
   */
  createDetectionRun(
    projectId: string,
    runName: string,
    agrUsers: AgrUser[],
    agrTcodes: AgrTCode[]
  ): string {
    const runId = uuidv4();

    // Create detection run record
    this.db.prepare(
      `INSERT INTO sod_detection_runs (id, project_id, run_name, users_count, roles_count, tcodes_count, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      runId,
      projectId,
      runName,
      agrUsers.length,
      new Set(agrTcodes.map(t => t.role_name)).size,
      new Set(agrTcodes.map(t => t.tcode)).size,
      'completed'
    );

    // Store AGR_USERS
    agrUsers.forEach(user => {
      this.db.prepare(
        `INSERT INTO agr_users (id, detection_run_id, uname, user_full_name, user_type, locked_status)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        uuidv4(),
        runId,
        user.uname,
        user.user_full_name || '',
        user.user_type || 'Dialog',
        user.locked_status || 'Unlocked'
      );
    });

    // Store AGR_1251 (role-tcode mappings)
    agrTcodes.forEach(tcode => {
      this.db.prepare(
        `INSERT INTO agr_1251 (id, detection_run_id, role_name, tcode, tcode_description, auth_object)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(
        uuidv4(),
        runId,
        tcode.role_name,
        tcode.tcode,
        tcode.tcode_description || '',
        tcode.auth_object || ''
      );
    });

    return runId;
  }

  /**
   * Run SoD detection against uploaded data
   */
  runDetection(runId: string, projectId: string): DetectionRunResult {
    const violations: SoDViolation[] = [];

    // Get all active SoD rules
    const rules = this.db.prepare(`SELECT * FROM sod_rules WHERE is_active = 1`).all();
    
    // Get all users and their role assignments from the detection run
    const users = this.db.prepare(
      `SELECT DISTINCT a.uname FROM agr_users a WHERE a.detection_run_id = ?`
    ).all(runId);

    const userRoles = new Map<string, Set<string>>();
    const roleToTcodes = new Map<string, Set<string>>();
    const userToTcodes = new Map<string, Set<string>>();

    // Build data structures
    const agrUsers = this.db.prepare(`SELECT * FROM agr_users WHERE detection_run_id = ?`).all(runId);
    const agrTcodes = this.db.prepare(`SELECT * FROM agr_1251 WHERE detection_run_id = ?`).all(runId);

    // Build role-to-tcodes mapping
    agrTcodes.forEach((entry: any) => {
      if (!roleToTcodes.has(entry.role_name)) {
        roleToTcodes.set(entry.role_name, new Set());
      }
      roleToTcodes.get(entry.role_name)!.add(entry.tcode);
    });

    // Build user-to-roles mapping (this would come from a join in real SAP)
    // For MVP, we simulate this by assuming some users have certain roles
    // In production, you'd have another table mapping users to roles
    const userRoleMap = this.simulateUserRoleAssignments(agrUsers, agrTcodes);

    // Build user-to-tcodes mapping
    userRoleMap.forEach((roles, userName) => {
      const tcodes = new Set<string>();
      roles.forEach(role => {
        const roleTcodes = roleToTcodes.get(role) || new Set();
        roleTcodes.forEach(tcode => tcodes.add(tcode));
      });
      userToTcodes.set(userName, tcodes);
    });

    // Apply each SoD rule
    rules.forEach((rule: any) => {
      const tcode1 = rule.tcode_1;
      const tcode2 = rule.tcode_2;

      // Check Rule 1: User directly has both tcodes
      userToTcodes.forEach((tcodes, userName) => {
        if (tcodes.has(tcode1) && tcodes.has(tcode2)) {
          violations.push({
            id: uuidv4(),
            violation_type: 'user_has_both_tcodes',
            severity: rule.severity as any,
            tcode_1: tcode1,
            tcode_2: tcode2,
            user_name: userName,
            affected_user_count: 1,
            rule_name: rule.rule_name,
            description: `User ${userName} has both ${tcode1} and ${tcode2}: ${rule.conflict_description}`,
            remediation_suggestion: `Remove access to either ${tcode1} or ${tcode2} from user ${userName} or one of their roles`,
          });
        }
      });

      // Check Rule 2: Role has both tcodes
      roleToTcodes.forEach((tcodes, roleName) => {
        if (tcodes.has(tcode1) && tcodes.has(tcode2)) {
          // Count users with this role
          const affectedUsers = Array.from(userRoleMap.entries())
            .filter(([_, roles]) => roles.has(roleName))
            .length;

          violations.push({
            id: uuidv4(),
            violation_type: 'role_has_both_tcodes',
            severity: rule.severity as any,
            tcode_1: tcode1,
            tcode_2: tcode2,
            role_1: roleName,
            affected_user_count: affectedUsers,
            rule_name: rule.rule_name,
            description: `Role ${roleName} contains both ${tcode1} and ${tcode2}: ${rule.conflict_description} (affects ${affectedUsers} user(s))`,
            remediation_suggestion: `Remove ${tcode1} or ${tcode2} from role ${roleName}, or split role into separate roles per user assignment`,
          });
        }
      });

      // Check Rule 3: User via multiple roles
      userRoleMap.forEach((roles, userName) => {
        let hasCode1ViaRole: string | null = null;
        let hasCode2ViaRole: string | null = null;

        roles.forEach(role => {
          const tcodes = roleToTcodes.get(role) || new Set();
          if (tcodes.has(tcode1)) hasCode1ViaRole = role;
          if (tcodes.has(tcode2)) hasCode2ViaRole = role;
        });

        if (hasCode1ViaRole && hasCode2ViaRole && hasCode1ViaRole !== hasCode2ViaRole) {
          // Avoid duplicates
          const duplicate = violations.some(
            v => v.violation_type === 'user_via_multiple_roles' &&
                 v.user_name === userName &&
                 v.tcode_1 === tcode1 &&
                 v.tcode_2 === tcode2
          );

          if (!duplicate) {
            violations.push({
              id: uuidv4(),
              violation_type: 'user_via_multiple_roles',
              severity: rule.severity as any,
              tcode_1: tcode1,
              tcode_2: tcode2,
              user_name: userName,
              role_1: hasCode1ViaRole,
              role_2: hasCode2ViaRole,
              affected_user_count: 1,
              rule_name: rule.rule_name,
              description: `User ${userName} has ${tcode1} via role ${hasCode1ViaRole} and ${tcode2} via role ${hasCode2ViaRole}: ${rule.conflict_description}`,
              remediation_suggestion: `Review assignment of ${hasCode1ViaRole} and ${hasCode2ViaRole} to user ${userName}. Consider consolidating or reassigning one role.`,
            });
          }
        }
      });
    });

    // Store violations
    violations.forEach(violation => {
      this.db.prepare(
        `INSERT INTO sod_detected_violations 
         (id, detection_run_id, project_id, violation_type, severity, tcode_1, tcode_2, user_name, role_1, role_2, affected_user_count, rule_name, description, remediation_suggestion, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')`
      ).run(
        violation.id,
        runId,
        projectId,
        violation.violation_type,
        violation.severity,
        violation.tcode_1,
        violation.tcode_2,
        violation.user_name || null,
        violation.role_1 || null,
        violation.role_2 || null,
        violation.affected_user_count,
        violation.rule_name,
        violation.description,
        violation.remediation_suggestion
      );
    });

    return {
      runId,
      usersCount: agrUsers.length,
      rolesCount: new Set(agrTcodes.map((t: any) => t.role_name)).size,
      tcodesCount: new Set(agrTcodes.map((t: any) => t.tcode)).size,
      violationsFound: violations.length,
      violations,
    };
  }

  /**
   * Simulate user-to-role assignments
   * In production, this would come from a user-role assignment table
   */
  private simulateUserRoleAssignments(
    agrUsers: any[],
    agrTcodes: any[]
  ): Map<string, Set<string>> {
    const userRoles = new Map<string, Set<string>>();
    const uniqueRoles = new Set(agrTcodes.map(t => t.role_name));

    // Simulate: each user gets 1-3 roles
    agrUsers.forEach((user, index) => {
      const roleArray = Array.from(uniqueRoles);
      const rolesPerUser = 1 + (index % 3); // 1-3 roles per user
      const assignedRoles = new Set<string>();

      for (let i = 0; i < rolesPerUser && i < roleArray.length; i++) {
        // Distribute roles somewhat evenly
        assignedRoles.add(roleArray[(index + i) % roleArray.length]);
      }

      if (assignedRoles.size > 0) {
        userRoles.set(user.uname, assignedRoles);
      }
    });

    return userRoles;
  }

  /**
   * Get violations for a detection run
   */
  getViolations(runId: string): SoDViolation[] {
    const dbViolations = this.db.prepare(
      `SELECT * FROM sod_detected_violations WHERE detection_run_id = ? ORDER BY severity DESC, affected_user_count DESC`
    ).all(runId);

    return dbViolations.map((v: any) => ({
      id: v.id,
      violation_type: v.violation_type,
      severity: v.severity,
      tcode_1: v.tcode_1,
      tcode_2: v.tcode_2,
      user_name: v.user_name,
      role_1: v.role_1,
      role_2: v.role_2,
      affected_user_count: v.affected_user_count,
      rule_name: v.rule_name,
      description: v.description,
      remediation_suggestion: v.remediation_suggestion,
    }));
  }

  /**
   * Get detection run info
   */
  getDetectionRun(runId: string): any {
    return this.db.prepare(`SELECT * FROM sod_detection_runs WHERE id = ?`).get(runId);
  }

  /**
   * Get all detection runs for a project
   */
  getDetectionRuns(projectId: string): any[] {
    return this.db.prepare(`SELECT * FROM sod_detection_runs WHERE project_id = ? ORDER BY uploaded_at DESC`).all(projectId);
  }

  /**
   * Update violation status
   */
  updateViolationStatus(violationId: string, status: string): void {
    this.db.prepare(`UPDATE sod_detected_violations SET status = ? WHERE id = ?`).run(status, violationId);
  }
}
