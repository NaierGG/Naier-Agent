import { GoogleGenerativeAI } from "@google/generative-ai";

import { ALL_NODE_TYPES, NODE_DEFINITIONS } from "@/lib/nodes/registry";
import type { ConversationMessage, NodeType, Workflow, WorkflowEdge, WorkflowNode } from "@/types";

type GeminiWorkflowResponse = {
  type?: "workflow_generated" | "need_more_info" | "clarification";
  message?: string;
  questions?: string[];
  workflow?: Partial<Workflow> & {
    nodes?: Array<Partial<WorkflowNode>>;
    edges?: Array<Partial<WorkflowEdge>>;
  };
};

function buildNodeCatalogPrompt() {
  const printableDefinitions = ALL_NODE_TYPES.map((nodeType) => {
    const nodeDefinition = NODE_DEFINITIONS[nodeType];

    return {
      type: nodeDefinition.type,
      label: nodeDefinition.label,
      description: nodeDefinition.description,
      category: nodeDefinition.category,
      configSchema: nodeDefinition.configSchema
    };
  });

  return JSON.stringify(printableDefinitions, null, 2);
}

function buildSystemPrompt() {
  return `
당신은 StockFlow AI의 워크플로우 생성 전문가입니다.
한국 주식 투자자들이 자연어로 설명하면, 실행 가능한 자동화 워크플로우 JSON을 생성합니다.

## 사용 가능한 노드 타입:
${buildNodeCatalogPrompt()}

## 응답 규칙:
1. 워크플로우를 생성할 수 있으면 반드시 아래 JSON 형식으로 응답하세요.
2. 정보가 부족하면 질문을 하세요. 질문은 한 번에 최대 2개만 하세요.
3. 항상 한국어로 응답하세요.
4. 지원 가능한 노드만 사용하세요.
5. 스케줄이 명확하면 trigger_schedule을 사용하고, 그렇지 않으면 trigger_manual을 사용하세요.
6. 노드는 실행 순서대로 배열하고, edges도 같은 순서로 연결하세요.

## 응답 JSON 형식:
{
  "type": "workflow_generated" | "need_more_info" | "clarification",
  "message": "사용자에게 보낼 메시지",
  "questions": ["질문1", "질문2"],
  "workflow": {
    "name": "워크플로우 이름",
    "description": "설명",
    "schedule_cron": "0 9 * * 1-5",
    "nodes": [
      {
        "id": "node_1",
        "type": "trigger_schedule",
        "label": "평일 오전 9시",
        "position": { "x": 100, "y": 100 },
        "config": { "cron_expression": "0 9 * * 1-5", "timezone": "Asia/Seoul" }
      }
    ],
    "edges": [
      { "id": "edge_1", "source": "node_1", "target": "node_2" }
    ]
  }
}

## 예시:
예시 1
사용자: "삼성전자 뉴스 매일 아침 9시에 텔레그램으로 받고 싶어"
응답 방향: trigger_schedule -> naver_stock_news(005930) -> send_telegram

예시 2
사용자: "DART 공시 나오면 AI가 요약해서 디스코드로 보내줘"
질문: "어떤 기업의 공시를 받으시겠어요? 종목코드나 기업명을 알려주세요."
후속 응답 방향: trigger_schedule(0 8 * * 1-5) -> dart_news -> ai_summarize -> send_discord
`.trim();
}

function extractJsonString(rawText: string) {
  const fencedMatch = rawText.match(/```json\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1);
  }

  return rawText.trim();
}

function ensureTriggerNode(
  nodes: WorkflowNode[],
  scheduleCron: string | null
): WorkflowNode[] {
  const hasTrigger = nodes.some(
    (node) => node.type === "trigger_schedule" || node.type === "trigger_manual"
  );

  if (hasTrigger) {
    return nodes;
  }

  if (scheduleCron) {
    return [
      {
        id: "node_1",
        type: "trigger_schedule",
        label: "자동 생성 스케줄 트리거",
        position: { x: 100, y: 200 },
        config: {
          cron_expression: scheduleCron,
          timezone: "Asia/Seoul"
        }
      },
      ...nodes
    ];
  }

  return [
    {
      id: "node_1",
      type: "trigger_manual",
      label: "수동 실행",
      position: { x: 100, y: 200 },
      config: {}
    },
    ...nodes
  ];
}

function buildSequentialEdges(nodes: WorkflowNode[]) {
  const edges: WorkflowEdge[] = [];

  for (let index = 0; index < nodes.length - 1; index += 1) {
    edges.push({
      id: `edge_${index + 1}`,
      source: nodes[index].id,
      target: nodes[index + 1].id
    });
  }

  return edges;
}

function sanitizeWorkflow(workflow: GeminiWorkflowResponse["workflow"], userMessage: string) {
  const rawNodes = Array.isArray(workflow?.nodes) ? workflow?.nodes : [];
  const validNodes: WorkflowNode[] = rawNodes
    .map((node, index) => {
      const type = String(node.type || "") as NodeType;

      if (!ALL_NODE_TYPES.includes(type)) {
        return null;
      }

      const nodeDefinition = NODE_DEFINITIONS[type];

      return {
        id: String(node.id || `node_${index + 1}`),
        type,
        label: String(node.label || nodeDefinition.label),
        config:
          node.config && typeof node.config === "object" && !Array.isArray(node.config)
            ? (node.config as Record<string, unknown>)
            : {},
        position: {
          x: index * 250 + 100,
          y: 200
        }
      } satisfies WorkflowNode;
    })
    .filter((node): node is WorkflowNode => node !== null);

  const normalizedScheduleCron =
    typeof workflow?.schedule_cron === "string" && workflow.schedule_cron.trim()
      ? workflow.schedule_cron.trim()
      : null;

  const nodesWithTrigger = ensureTriggerNode(validNodes, normalizedScheduleCron).map(
    (node, index) => ({
      ...node,
      id: `node_${index + 1}`,
      position: {
        x: index * 250 + 100,
        y: 200
      }
    })
  );

  if (nodesWithTrigger.length === 0) {
    return null;
  }

  const validNodeIds = new Set(nodesWithTrigger.map((node) => node.id));
  const rawEdges = Array.isArray(workflow?.edges) ? workflow.edges : [];
  const cleanedEdges = rawEdges
    .map((edge, index) => ({
      id: String(edge.id || `edge_${index + 1}`),
      source: String(edge.source || ""),
      target: String(edge.target || "")
    }))
    .filter(
      (edge) =>
        validNodeIds.has(edge.source) &&
        validNodeIds.has(edge.target) &&
        edge.source !== edge.target
    );

  const edges = cleanedEdges.length > 0 ? cleanedEdges : buildSequentialEdges(nodesWithTrigger);
  const triggerScheduleNode = nodesWithTrigger.find(
    (node) => node.type === "trigger_schedule"
  );
  const scheduleCron =
    typeof triggerScheduleNode?.config?.cron_expression === "string" &&
    triggerScheduleNode.config.cron_expression.trim()
      ? triggerScheduleNode.config.cron_expression.trim()
      : normalizedScheduleCron;

  const baseName =
    typeof workflow?.name === "string" && workflow.name.trim()
      ? workflow.name.trim()
      : `${userMessage.trim().slice(0, 24)} 워크플로우`;

  return {
    name: baseName,
    description:
      typeof workflow?.description === "string" && workflow.description.trim()
        ? workflow.description.trim()
        : `${userMessage.trim()} 자동화를 위한 워크플로우`,
    schedule_cron: scheduleCron || null,
    nodes: nodesWithTrigger,
    edges,
    is_active: false
  } satisfies Partial<Workflow>;
}

function normalizeQuestions(questions: unknown) {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions
    .map((question) => String(question || "").trim())
    .filter(Boolean)
    .slice(0, 2);
}

export async function generateWorkflowFromChat(
  userMessage: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  geminiApiKey: string
): Promise<{
  workflow: Partial<Workflow> | null;
  assistantMessage: string;
  needsMoreInfo: boolean;
  questions: string[];
}> {
  const client = new GoogleGenerativeAI(geminiApiKey);
  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: buildSystemPrompt()
  });

  const history = conversationHistory.map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }]
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.4,
      responseMimeType: "application/json"
    }
  });

  const response = await chat.sendMessage(userMessage);
  const rawText = response.response.text();
  const parsedText = extractJsonString(rawText);
  let parsedResponse: GeminiWorkflowResponse;

  try {
    parsedResponse = JSON.parse(parsedText) as GeminiWorkflowResponse;
  } catch {
    return {
      workflow: null,
      assistantMessage:
        "응답을 이해하지 못했어요. 자동화 목적과 종목, 알림 채널을 조금 더 구체적으로 알려주세요.",
      needsMoreInfo: true,
      questions: [
        "어떤 종목이나 기업을 대상으로 할까요?",
        "결과를 어디로 보내드릴까요? 예: 텔레그램, 디스코드, 이메일"
      ]
    };
  }

  const message =
    typeof parsedResponse.message === "string" && parsedResponse.message.trim()
      ? parsedResponse.message.trim()
      : "요청 내용을 바탕으로 워크플로우를 준비했습니다.";

  if (
    parsedResponse.type === "need_more_info" ||
    parsedResponse.type === "clarification"
  ) {
    return {
      workflow: null,
      assistantMessage: message,
      needsMoreInfo: true,
      questions: normalizeQuestions(parsedResponse.questions)
    };
  }

  const sanitizedWorkflow = sanitizeWorkflow(parsedResponse.workflow, userMessage);

  if (!sanitizedWorkflow) {
    return {
      workflow: null,
      assistantMessage:
        "워크플로우 구조를 완성하기에 정보가 조금 부족합니다. 핵심 조건을 한 번만 더 알려주세요.",
      needsMoreInfo: true,
      questions: [
        "어떤 데이터 소스를 쓸까요? 예: 네이버 뉴스, DART 공시, 주가 조회",
        "실행 시점은 언제가 좋을까요? 예: 평일 오전 9시, 수동 실행"
      ]
    };
  }

  return {
    workflow: sanitizedWorkflow,
    assistantMessage: message,
    needsMoreInfo: false,
    questions: []
  };
}
