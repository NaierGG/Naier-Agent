import type {
  NodeCategory,
  NodeConfigField,
  NodeConfigFieldOption,
  NodeDefinition,
  NodeType
} from "@/lib/nodes/types";

export type {
  NodeCategory,
  NodeConfigField,
  NodeConfigFieldOption,
  NodeDefinition,
  NodeType
};

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: Record<string, any>;
  position: WorkflowNodePosition;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  schedule_cron: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  last_executed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkflowExecutionStatus = "running" | "success" | "failed";
export type ExecutionLogStatus = "running" | "success" | "failed" | "skipped";
export type WorkflowTriggerType = "schedule" | "manual" | "webhook";

export interface ExecutionLog {
  node_id: string;
  node_label: string;
  status: ExecutionLogStatus;
  input: any;
  output: any;
  error: string | null;
  duration_ms: number;
  timestamp: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id?: string;
  status: WorkflowExecutionStatus;
  trigger_type?: WorkflowTriggerType;
  started_at: string;
  finished_at: string | null;
  logs: ExecutionLog[];
  error_message?: string | null;
}

export interface UserApiKeys {
  gemini_api_key?: string | null;
  telegram_bot_token?: string | null;
  telegram_chat_id?: string | null;
  discord_webhook_url?: string | null;
  dart_api_key?: string | null;
  email_smtp_host?: string | null;
  email_smtp_port?: number | null;
  email_smtp_user?: string | null;
  email_smtp_pass?: string | null;
  email_to?: string | null;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Profile {
  id: string;
  email: string;
  display_name?: string | null;
  created_at: string;
}
