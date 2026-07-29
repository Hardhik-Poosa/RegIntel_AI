export type UserRole = 'ADMIN' | 'COMPLIANCE_OFFICER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  organization_id: string;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  plan_tier?: string;
  control_limit?: number;
  created_at: string;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type ControlStatus = 'PASS' | 'FAIL' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface Control {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  status: ControlStatus;
  risk_level: RiskLevel;
  weighted_score: number;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Framework {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  version: string;
  is_installed: boolean;
  control_count?: number;
}

export interface Evidence {
  id: string;
  title: string;
  description?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  control_id: string;
  organization_id: string;
  validation_status: 'VALID' | 'INVALID' | 'PENDING';
  validation_notes?: string;
  created_at: string;
}

export interface RiskForecast {
  current_risk_score: number;
  projected_risk_score: number;
  potential_gain: number;
  risk_factors: Array<{
    category: string;
    factor: string;
    impact: number;
  }>;
}

export interface ComplianceSnapshot {
  id: string;
  overall_score: number;
  total_controls: number;
  passed_controls: number;
  failed_controls: number;
  high_risk_issues: number;
  snapshot_date: string;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  user_id: string;
  user_email?: string;
  timestamp: string;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ComplianceMonitorResult {
  id: string;
  check_type: 'GITHUB' | 'CONTROLS' | 'EVIDENCE' | 'AWS' | 'AZURE';
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: Record<string, any>;
  checked_at: string;
}
