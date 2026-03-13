export type NodeCategory = "trigger" | "source" | "filter" | "ai" | "action";

export type NodeConfigFieldType =
  | "text"
  | "number"
  | "select"
  | "textarea"
  | "boolean";

export interface NodeConfigFieldOption {
  label: string;
  value: string;
}

export interface NodeConfigField {
  key: string;
  label: string;
  type: NodeConfigFieldType;
  required: boolean;
  placeholder?: string;
  options?: NodeConfigFieldOption[];
  defaultValue?: string | number | boolean | string[];
  description?: string;
  multiple?: boolean;
  min?: number;
  max?: number;
}

export type NodeType =
  | "trigger_schedule"
  | "trigger_manual"
  | "dart_news"
  | "naver_stock_news"
  | "korea_stock_price"
  | "filter_keyword"
  | "condition"
  | "delay"
  | "ai_summarize"
  | "send_telegram"
  | "send_discord"
  | "send_email";

export interface NodeDefinition {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  category: NodeCategory;
  configSchema: NodeConfigField[];
  outputExample?: Record<string, unknown>;
}
