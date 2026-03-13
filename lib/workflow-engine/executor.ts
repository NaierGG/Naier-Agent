import { GoogleGenerativeAI } from "@google/generative-ai";
import { load } from "cheerio";
import nodemailer from "nodemailer";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getStoredUserApiKeys } from "@/lib/settings/user-api-keys";
import type {
  ExecutionLog,
  NodeType,
  UserApiKeys,
  Workflow,
  WorkflowEdge,
  WorkflowExecution,
  WorkflowNode,
  WorkflowTriggerType
} from "@/types";

const CRITICAL_NODE_TYPES = new Set<NodeType>([
  "trigger_schedule",
  "trigger_manual",
  "dart_news",
  "naver_stock_news",
  "korea_stock_price"
]);

const ARRAY_OUTPUT_KEYS = ["items", "news", "disclosures", "prices", "summaries"];
const MAX_LOG_BYTES = 10_000;
const NAVER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

type WorkflowRecord = Workflow & {
  nodes: WorkflowNode[] | null;
  edges: WorkflowEdge[] | null;
};

type NaverNewsItem = {
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  stockCode: string;
};

type DARTDisclosureItem = {
  title: string;
  corp_name: string;
  date: string;
  url: string;
  type: string;
};

type StockPriceItem = {
  code: string;
  name: string;
  price: number | null;
  change: number | null;
  changeRate: number | null;
  volume: number | null;
  marketCap: number | null;
  indicators?: Record<string, number | null> | null;
};

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitTextInput(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDartDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function formatKoreanDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul"
  }).format(date);
}

function truncateForLog(value: unknown) {
  if (value === undefined) {
    return null;
  }

  try {
    const serialized = JSON.stringify(value);

    if (!serialized) {
      return value;
    }

    if (serialized.length <= MAX_LOG_BYTES) {
      return value;
    }

    return {
      __truncated: true,
      preview: serialized.slice(0, MAX_LOG_BYTES),
      originalLength: serialized.length
    };
  } catch {
    return {
      __truncated: true,
      preview: String(value).slice(0, MAX_LOG_BYTES)
    };
  }
}

function getByPath(target: unknown, path: string) {
  if (!path) {
    return target;
  }

  return path
    .split(".")
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (Array.isArray(current)) {
        const index = Number.parseInt(segment, 10);
        return Number.isNaN(index) ? undefined : current[index];
      }

      if (isRecord(current)) {
        return current[segment];
      }

      return undefined;
    }, target);
}

function extractItems(input: unknown): unknown[] {
  if (Array.isArray(input)) {
    return input;
  }

  if (!isRecord(input)) {
    return [];
  }

  for (const key of ARRAY_OUTPUT_KEYS) {
    const value = input[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  if ("data" in input) {
    return extractItems(input.data);
  }

  return [];
}

function replacePrimaryArray(input: unknown, items: unknown[]) {
  if (Array.isArray(input)) {
    return items;
  }

  if (isRecord(input)) {
    for (const key of ARRAY_OUTPUT_KEYS) {
      if (Array.isArray(input[key])) {
        return {
          ...input,
          [key]: items
        };
      }
    }
  }

  return {
    items
  };
}

function buildTemplateContext(input: unknown) {
  if (Array.isArray(input)) {
    return {
      items: input,
      input,
      data: input
    };
  }

  if (isRecord(input)) {
    return {
      ...input,
      items: extractItems(input),
      input,
      data: input
    };
  }

  return {
    items: [],
    input,
    data: input,
    value: input
  };
}

export function renderTemplate(template: string, data: unknown): string {
  const context = buildTemplateContext(data);

  const withLoops = template.replace(
    /{{#each\s+([^}]+)}}([\s\S]*?){{\/each}}/g,
    (_, collectionPath: string, innerTemplate: string) => {
      const collection = getByPath(context, collectionPath.trim());

      if (!Array.isArray(collection)) {
        return "";
      }

      return collection
        .map((item, index) =>
          renderTemplate(innerTemplate, {
            ...context,
            ...(isRecord(item) ? item : { value: item }),
            this: item,
            item,
            index
          })
        )
        .join("");
    }
  );

  return withLoops.replace(/{{\s*([^{}#\/][^}]*)\s*}}/g, (_, rawPath: string) => {
    const path = rawPath.trim();

    if (path === "date") {
      return formatKoreanDate(new Date());
    }

    const value = path === "this" ? context : getByPath(context, path);

    if (value === undefined || value === null) {
      return "";
    }

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    return JSON.stringify(value);
  });
}

function normalizeExecutionInput(
  node: WorkflowNode,
  input: unknown,
  triggerPayload: Record<string, unknown>
) {
  if (node.type === "trigger_schedule" || node.type === "trigger_manual") {
    return triggerPayload;
  }

  return input ?? triggerPayload;
}

function clampDelaySeconds(value: unknown) {
  const parsed = Number.parseInt(String(value ?? 0), 10);

  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return Math.min(parsed, 30);
}

function getIncomingEdgeMap(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const incoming = new Map<string, string[]>();

  for (const node of nodes) {
    incoming.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      continue;
    }

    incoming.get(edge.target)?.push(edge.source);
  }

  return incoming;
}

function getNodeInput(
  nodeId: string,
  incomingEdgeMap: Map<string, string[]>,
  nodeOutputs: Map<string, unknown>,
  triggerPayload: Record<string, unknown>
) {
  const incomingNodeIds = incomingEdgeMap.get(nodeId) || [];

  if (incomingNodeIds.length === 0) {
    return triggerPayload;
  }

  if (incomingNodeIds.length === 1) {
    return nodeOutputs.get(incomingNodeIds[0]) ?? triggerPayload;
  }

  const parentOutputs = incomingNodeIds
    .map((parentId) => nodeOutputs.get(parentId))
    .filter((value) => value !== undefined);

  return {
    items: parentOutputs.flatMap((output) => extractItems(output)),
    byNode: Object.fromEntries(
      incomingNodeIds.map((parentId) => [parentId, nodeOutputs.get(parentId) ?? null])
    )
  };
}

function topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const adjacencyMap = new Map<string, string[]>();
  const indegreeMap = new Map<string, number>();

  for (const node of nodes) {
    adjacencyMap.set(node.id, []);
    indegreeMap.set(node.id, 0);
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      continue;
    }

    adjacencyMap.get(edge.source)?.push(edge.target);
    indegreeMap.set(edge.target, (indegreeMap.get(edge.target) || 0) + 1);
  }

  const queue = nodes.filter((node) => (indegreeMap.get(node.id) || 0) === 0);
  const sortedNodes: WorkflowNode[] = [];

  while (queue.length > 0) {
    const currentNode = queue.shift();

    if (!currentNode) {
      break;
    }

    sortedNodes.push(currentNode);

    for (const nextNodeId of adjacencyMap.get(currentNode.id) || []) {
      const nextIndegree = (indegreeMap.get(nextNodeId) || 0) - 1;
      indegreeMap.set(nextNodeId, nextIndegree);

      if (nextIndegree === 0) {
        const nextNode = nodeMap.get(nextNodeId);

        if (nextNode) {
          queue.push(nextNode);
        }
      }
    }
  }

  return sortedNodes.length === nodes.length ? sortedNodes : nodes;
}

function parseNumericValue(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(/,/g, ""));
  return Number.isNaN(parsed) ? null : parsed;
}

function inferSentiment(value: string) {
  const normalized = value.toLowerCase();

  if (
    ["positive", "bullish", "호재", "긍정", "상승"].some((keyword) =>
      normalized.includes(keyword)
    )
  ) {
    return "positive" as const;
  }

  if (
    ["negative", "bearish", "악재", "부정", "하락"].some((keyword) =>
      normalized.includes(keyword)
    )
  ) {
    return "negative" as const;
  }

  return "neutral" as const;
}

function parseSummaryResponse(rawResponse: string) {
  const normalized = rawResponse.trim();

  try {
    const parsed = JSON.parse(normalized) as {
      summary?: string;
      sentiment?: "positive" | "negative" | "neutral";
    };

    if (parsed.summary) {
      return {
        summary: parsed.summary,
        sentiment: parsed.sentiment || inferSentiment(parsed.summary)
      };
    }
  } catch {
    // Ignore JSON parsing failures and fall back to raw text.
  }

  return {
    summary: normalized,
    sentiment: inferSentiment(normalized)
  };
}

function evaluateCondition(
  operator: string,
  actualValue: unknown,
  expectedRawValue: unknown
) {
  const actualNumber = parseNumericValue(actualValue);
  const expectedNumber = parseNumericValue(expectedRawValue);

  switch (operator) {
    case ">":
      return actualNumber !== null && expectedNumber !== null
        ? actualNumber > expectedNumber
        : false;
    case "<":
      return actualNumber !== null && expectedNumber !== null
        ? actualNumber < expectedNumber
        : false;
    case ">=":
      return actualNumber !== null && expectedNumber !== null
        ? actualNumber >= expectedNumber
        : false;
    case "<=":
      return actualNumber !== null && expectedNumber !== null
        ? actualNumber <= expectedNumber
        : false;
    case "==":
      return String(actualValue) === String(expectedRawValue);
    case "!=":
      return String(actualValue) !== String(expectedRawValue);
    case "contains":
      if (Array.isArray(actualValue)) {
        return actualValue.some((item) => String(item).includes(String(expectedRawValue)));
      }

      return String(actualValue ?? "").includes(String(expectedRawValue ?? ""));
    default:
      return false;
  }
}

function parseNewsRows(html: string, stockCode: string) {
  const $ = load(html);
  const parsedItems: NaverNewsItem[] = [];

  $("table.type5 tr").each((_, row) => {
    const titleCell = $(row).find("td.title");
    const anchor = titleCell.find("a");
    const title = normalizeWhitespace(anchor.text());

    if (!title) {
      return;
    }

    const href = anchor.attr("href") || "";
    const source = normalizeWhitespace($(row).find("td.info").text());
    const publishedAt = normalizeWhitespace($(row).find("td.date").text());

    parsedItems.push({
      title,
      summary: title,
      url: href.startsWith("http") ? href : `https://finance.naver.com${href}`,
      source,
      publishedAt,
      stockCode
    });
  });

  if (parsedItems.length > 0) {
    return parsedItems;
  }

  $(".newsList li").each((_, item) => {
    const anchor = $(item).find("a");
    const title = normalizeWhitespace(anchor.text());

    if (!title) {
      return;
    }

    parsedItems.push({
      title,
      summary: normalizeWhitespace($(item).find(".desc").text()) || title,
      url: anchor.attr("href")?.startsWith("http")
        ? (anchor.attr("href") as string)
        : `https://finance.naver.com${anchor.attr("href") || ""}`,
      source: normalizeWhitespace($(item).find(".source").text()),
      publishedAt: normalizeWhitespace($(item).find(".date").text()),
      stockCode
    });
  });

  return parsedItems;
}

async function executeDartNewsNode(
  node: WorkflowNode,
  userApiKeys: Partial<UserApiKeys>
) {
  if (!userApiKeys.dart_api_key) {
    throw new Error("DART API 키가 설정되지 않았습니다.");
  }

  const corpCode = String(node.config.corp_code || "").trim();

  if (!corpCode) {
    throw new Error("DART corp_code 설정이 필요합니다.");
  }

  const daysBack = Number.parseInt(String(node.config.days_back || 1), 10);
  const endDate = new Date();
  const beginDate = new Date(endDate);
  beginDate.setDate(endDate.getDate() - Math.max(0, daysBack - 1));

  const url = new URL("https://opendart.fss.or.kr/api/list.json");
  url.searchParams.set("crtfc_key", userApiKeys.dart_api_key);
  url.searchParams.set("corp_code", corpCode);
  url.searchParams.set("bgn_de", formatDartDate(beginDate));
  url.searchParams.set("end_de", formatDartDate(endDate));
  url.searchParams.set("page_count", "20");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  const result = (await response.json()) as {
    status?: string;
    message?: string;
    list?: Array<{
      report_nm?: string;
      corp_name?: string;
      rcept_no?: string;
      rcept_dt?: string;
      pblntf_ty?: string;
    }>;
  };

  if (!response.ok) {
    throw new Error(result.message || "DART 공시 조회에 실패했습니다.");
  }

  if (result.status && result.status !== "000" && result.status !== "013") {
    throw new Error(result.message || "DART API 응답이 올바르지 않습니다.");
  }

  const allowedTypes = Array.isArray(node.config.report_types)
    ? node.config.report_types.map(String)
    : splitTextInput(String(node.config.report_types || ""));

  const disclosures: DARTDisclosureItem[] = (result.list || [])
    .filter((item) =>
      allowedTypes.length === 0 ? true : allowedTypes.includes(String(item.pblntf_ty || ""))
    )
    .map((item) => ({
      title: item.report_nm || "",
      corp_name: item.corp_name || String(node.config.corp_name || ""),
      date: item.rcept_dt || "",
      url: item.rcept_no
        ? `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`
        : "https://dart.fss.or.kr",
      type: item.pblntf_ty || ""
    }));

  return {
    disclosures
  };
}

async function executeNaverStockNewsNode(node: WorkflowNode) {
  const stockCodes = splitTextInput(node.config.stock_codes);

  if (stockCodes.length === 0) {
    throw new Error("네이버 뉴스 수집을 위한 stock_codes 설정이 필요합니다.");
  }

  const keywordFilters = splitTextInput(node.config.keywords).map((keyword) =>
    keyword.toLowerCase()
  );
  const maxItems = Math.max(1, Number.parseInt(String(node.config.max_items || 10), 10));
  const collectedNews: NaverNewsItem[] = [];

  for (const stockCode of stockCodes) {
    const response = await fetch(
      `https://finance.naver.com/item/news_news.naver?code=${encodeURIComponent(
        stockCode
      )}&page=1`,
      {
        headers: {
          "User-Agent": NAVER_USER_AGENT
        }
      }
    );

    if (!response.ok) {
      throw new Error(`네이버 뉴스 조회에 실패했습니다: ${stockCode}`);
    }

    const html = await response.text();
    const parsedItems = parseNewsRows(html, stockCode);

    for (const item of parsedItems) {
      if (keywordFilters.length > 0) {
        const haystack = `${item.title} ${item.summary}`.toLowerCase();
        const matchesKeyword = keywordFilters.some((keyword) => haystack.includes(keyword));

        if (!matchesKeyword) {
          continue;
        }
      }

      collectedNews.push(item);

      if (collectedNews.length >= maxItems) {
        break;
      }
    }

    if (collectedNews.length >= maxItems) {
      break;
    }
  }

  return {
    news: collectedNews.slice(0, maxItems)
  };
}

async function executeKoreaStockPriceNode(node: WorkflowNode) {
  const stockCodes = splitTextInput(node.config.stock_codes);

  if (stockCodes.length === 0) {
    throw new Error("주가 조회를 위한 stock_codes 설정이 필요합니다.");
  }

  const includeIndicators = Boolean(node.config.include_indicators);
  const prices: StockPriceItem[] = [];

  for (const stockCode of stockCodes) {
    const response = await fetch(
      `https://m.stock.naver.com/api/stock/${encodeURIComponent(stockCode)}/basic`,
      {
        headers: {
          "User-Agent": NAVER_USER_AGENT,
          Accept: "application/json"
        }
      }
    );

    if (!response.ok) {
      throw new Error(`주가 조회에 실패했습니다: ${stockCode}`);
    }

    const result = (await response.json()) as Record<string, unknown>;

    prices.push({
      code: stockCode,
      name: String(result.stockName || result.itemName || result.name || stockCode),
      price:
        parseNumericValue(result.closePrice) ??
        parseNumericValue(result.price) ??
        parseNumericValue(result.tradePrice),
      change:
        parseNumericValue(result.compareToPreviousPrice) ??
        parseNumericValue(result.changePrice),
      changeRate:
        parseNumericValue(result.fluctuationsRatio) ??
        parseNumericValue(result.changeRate),
      volume:
        parseNumericValue(result.accumulatedTradingVolume) ??
        parseNumericValue(result.volume),
      marketCap:
        parseNumericValue(result.marketValue) ?? parseNumericValue(result.marketCap),
      indicators: includeIndicators
        ? {
            ma: null,
            rsi: null
          }
        : undefined
    });
  }

  return {
    prices
  };
}

function executeFilterKeywordNode(node: WorkflowNode, input: unknown) {
  const items = extractItems(input);
  const keywords = splitTextInput(node.config.keywords);

  if (keywords.length === 0) {
    throw new Error("키워드 필터에는 keywords 설정이 필요합니다.");
  }

  const matchType = String(node.config.match_type || "any");
  const caseSensitive = Boolean(node.config.case_sensitive);
  const targetField = String(node.config.target_field || "all");

  const normalizedKeywords = keywords.map((keyword) =>
    caseSensitive ? keyword : keyword.toLowerCase()
  );

  const filteredItems = items.filter((item) => {
    const candidateValues: string[] = [];

    if (targetField === "title" || targetField === "all") {
      candidateValues.push(String(getByPath(item, "title") || ""));
    }

    if (targetField === "content" || targetField === "all") {
      candidateValues.push(
        String(getByPath(item, "content") || getByPath(item, "summary") || "")
      );
    }

    const haystack = caseSensitive
      ? candidateValues.join(" ")
      : candidateValues.join(" ").toLowerCase();

    if (matchType === "all") {
      return normalizedKeywords.every((keyword) => haystack.includes(keyword));
    }

    return normalizedKeywords.some((keyword) => haystack.includes(keyword));
  });

  return replacePrimaryArray(input, filteredItems);
}

function executeConditionNode(node: WorkflowNode, input: unknown) {
  const fieldPath = String(node.config.field_path || "").trim();
  const operator = String(node.config.operator || "==");
  const compareValue = node.config.value;

  if (!fieldPath) {
    throw new Error("조건 분기에는 field_path 설정이 필요합니다.");
  }

  const actualValue = getByPath(input, fieldPath);

  return {
    matched: evaluateCondition(operator, actualValue, compareValue),
    data: input
  };
}

async function executeDelayNode(node: WorkflowNode, input: unknown) {
  const seconds = clampDelaySeconds(node.config.seconds);

  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));

  return input;
}

async function executeAiSummarizeNode(
  node: WorkflowNode,
  input: unknown,
  userApiKeys: Partial<UserApiKeys>
) {
  if (!userApiKeys.gemini_api_key) {
    throw new Error("Gemini API 키가 설정되지 않았습니다.");
  }

  const promptTemplate = String(node.config.prompt_template || "").trim();

  if (!promptTemplate) {
    throw new Error("AI 요약 프롬프트가 비어 있습니다.");
  }

  const modelName = String(node.config.model || "gemini-2.0-flash");
  const maxItems = Math.max(1, Number.parseInt(String(node.config.max_items || 5), 10));
  const items = extractItems(input);
  const targetItems = items.length > 0 ? items.slice(0, maxItems) : [input];
  const client = new GoogleGenerativeAI(userApiKeys.gemini_api_key);
  const model = client.getGenerativeModel({ model: modelName });
  const summaries = [];

  for (const item of targetItems) {
    const prompt = promptTemplate.replace(
      /{{\s*input\s*}}/g,
      JSON.stringify(item, null, 2)
    );

    const response = await model.generateContent(
      `${prompt}\n\n응답은 JSON 형식만 사용하세요: {"summary":"요약","sentiment":"positive|negative|neutral"}`
    );

    const parsedResponse = parseSummaryResponse(response.response.text());

    summaries.push({
      original: item,
      summary: parsedResponse.summary,
      sentiment: parsedResponse.sentiment
    });
  }

  return {
    summaries
  };
}

async function executeSendTelegramNode(
  node: WorkflowNode,
  input: unknown,
  userApiKeys: Partial<UserApiKeys>
) {
  if (!userApiKeys.telegram_bot_token || !userApiKeys.telegram_chat_id) {
    throw new Error("텔레그램 Bot Token 또는 Chat ID가 설정되지 않았습니다.");
  }

  const messageTemplate = String(node.config.message_template || "").trim();

  if (!messageTemplate) {
    throw new Error("텔레그램 메시지 템플릿이 비어 있습니다.");
  }

  const renderedMessage = renderTemplate(messageTemplate, input);
  const parseMode = String(node.config.parse_mode || "Markdown");
  const disablePreview = Boolean(node.config.disable_preview ?? true);
  const payload: Record<string, unknown> = {
    chat_id: userApiKeys.telegram_chat_id,
    text: renderedMessage,
    disable_web_page_preview: disablePreview
  };

  if (parseMode !== "plain") {
    payload.parse_mode = parseMode;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${userApiKeys.telegram_bot_token}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const result = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: {
      message_id?: number;
    };
  };

  if (!response.ok || result.ok === false) {
    throw new Error(result.description || "텔레그램 전송에 실패했습니다.");
  }

  return {
    sent: true,
    messageId: result.result?.message_id || null
  };
}

async function executeSendDiscordNode(
  node: WorkflowNode,
  input: unknown,
  userApiKeys: Partial<UserApiKeys>
) {
  if (!userApiKeys.discord_webhook_url) {
    throw new Error("Discord Webhook URL이 설정되지 않았습니다.");
  }

  const messageTemplate = String(node.config.message_template || "").trim();

  if (!messageTemplate) {
    throw new Error("디스코드 메시지 템플릿이 비어 있습니다.");
  }

  const message = renderTemplate(messageTemplate, input);
  const username = String(node.config.username || "StockFlow Bot").trim();
  const embedColor = String(node.config.embed_color || "").trim();
  const requestBody: Record<string, unknown> = {
    username
  };

  if (embedColor) {
    requestBody.embeds = [
      {
        description: message,
        color: Number.parseInt(embedColor.replace("#", ""), 16)
      }
    ];
  } else {
    requestBody.content = message;
  }

  const response = await fetch(userApiKeys.discord_webhook_url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "디스코드 전송에 실패했습니다.");
  }

  return {
    sent: true
  };
}

async function executeSendEmailNode(
  node: WorkflowNode,
  input: unknown,
  userApiKeys: Partial<UserApiKeys>
) {
  if (
    !userApiKeys.email_smtp_host ||
    !userApiKeys.email_smtp_port ||
    !userApiKeys.email_smtp_user ||
    !userApiKeys.email_smtp_pass ||
    !userApiKeys.email_to
  ) {
    throw new Error("이메일 전송에 필요한 SMTP 설정이 모두 필요합니다.");
  }

  const subjectTemplate = String(node.config.subject_template || "").trim();
  const bodyTemplate = String(node.config.body_template || "").trim();

  if (!subjectTemplate || !bodyTemplate) {
    throw new Error("이메일 제목과 본문 템플릿이 필요합니다.");
  }

  const format = String(node.config.format || "html");
  const subject = renderTemplate(subjectTemplate, input);
  const body = renderTemplate(bodyTemplate, input);
  const transporter = nodemailer.createTransport({
    host: userApiKeys.email_smtp_host,
    port: userApiKeys.email_smtp_port,
    secure: userApiKeys.email_smtp_port === 465,
    auth: {
      user: userApiKeys.email_smtp_user,
      pass: userApiKeys.email_smtp_pass
    }
  });

  const info = await transporter.sendMail({
    from: userApiKeys.email_smtp_user,
    to: userApiKeys.email_to,
    subject,
    text: format === "text" ? body : undefined,
    html: format === "html" ? body : undefined
  });

  return {
    sent: true,
    messageId: info.messageId
  };
}

async function executeNode(
  node: WorkflowNode,
  input: unknown,
  userApiKeys: Partial<UserApiKeys>,
  triggerType: WorkflowTriggerType
) {
  switch (node.type) {
    case "trigger_schedule":
    case "trigger_manual":
      return {
        triggered_at: new Date().toISOString(),
        trigger_type: triggerType
      };
    case "dart_news":
      return executeDartNewsNode(node, userApiKeys);
    case "naver_stock_news":
      return executeNaverStockNewsNode(node);
    case "korea_stock_price":
      return executeKoreaStockPriceNode(node);
    case "filter_keyword":
      return executeFilterKeywordNode(node, input);
    case "condition":
      return executeConditionNode(node, input);
    case "delay":
      return executeDelayNode(node, input);
    case "ai_summarize":
      return executeAiSummarizeNode(node, input, userApiKeys);
    case "send_telegram":
      return executeSendTelegramNode(node, input, userApiKeys);
    case "send_discord":
      return executeSendDiscordNode(node, input, userApiKeys);
    case "send_email":
      return executeSendEmailNode(node, input, userApiKeys);
    default:
      throw new Error(`지원되지 않는 노드 타입입니다: ${(node as WorkflowNode).type}`);
  }
}

async function updateExecutionLogs(
  supabaseServiceClient: SupabaseClient,
  executionId: string,
  logs: ExecutionLog[]
) {
  await supabaseServiceClient
    .from("workflow_executions")
    .update({
      logs
    })
    .eq("id", executionId);
}

export async function executeWorkflow(
  workflowId: string,
  userId: string,
  triggerType: WorkflowTriggerType,
  supabaseServiceClient: SupabaseClient
): Promise<WorkflowExecution> {
  let executionId: string | null = null;
  let workflow: WorkflowRecord | null = null;
  let executionLogs: ExecutionLog[] = [];
  let finalStatus: WorkflowExecution["status"] = "running";
  let finalErrorMessage: string | null = null;
  const startedAt = new Date().toISOString();

  try {
    const { data: workflowData, error: workflowError } = await supabaseServiceClient
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("user_id", userId)
      .single();

    if (workflowError || !workflowData) {
      throw new Error("워크플로우를 찾을 수 없습니다.");
    }

    workflow = workflowData as WorkflowRecord;

    if (triggerType === "schedule" && !workflow.is_active) {
      throw new Error("비활성화된 워크플로우는 스케줄 실행할 수 없습니다.");
    }

    const userApiKeys =
      (await getStoredUserApiKeys(supabaseServiceClient, userId)) || {};

    const { data: executionData, error: executionInsertError } =
      await supabaseServiceClient
        .from("workflow_executions")
        .insert({
          workflow_id: workflow.id,
          user_id: userId,
          status: "running",
          trigger_type: triggerType,
          started_at: startedAt,
          logs: []
        })
        .select()
        .single();

    if (executionInsertError || !executionData) {
      throw new Error(
        executionInsertError?.message || "실행 기록 생성에 실패했습니다."
      );
    }

    executionId = String(executionData.id);

    const nodes = Array.isArray(workflow.nodes) ? workflow.nodes : [];
    const edges = Array.isArray(workflow.edges) ? workflow.edges : [];
    const orderedNodes = topologicalSort(nodes, edges);
    const incomingEdgeMap = getIncomingEdgeMap(nodes, edges);
    const nodeOutputs = new Map<string, unknown>();
    const triggerPayload = {
      triggered_at: startedAt,
      trigger_type: triggerType
    };

    for (const node of orderedNodes) {
      const rawInput = getNodeInput(
        node.id,
        incomingEdgeMap,
        nodeOutputs,
        triggerPayload
      );
      const nodeInput = normalizeExecutionInput(node, rawInput, triggerPayload);
      const startedNodeAt = Date.now();
      let output: unknown = null;
      let errorMessage: string | null = null;
      let status: ExecutionLog["status"] = "success";

      try {
        output = await executeNode(node, nodeInput, userApiKeys, triggerType);
        nodeOutputs.set(node.id, output);
      } catch (error) {
        errorMessage =
          error instanceof Error ? error.message : "알 수 없는 노드 실행 오류입니다.";
        status = "failed";

        if (CRITICAL_NODE_TYPES.has(node.type)) {
          finalErrorMessage = errorMessage;
        } else {
          output = nodeInput;
          nodeOutputs.set(node.id, nodeInput);
        }
      }

      executionLogs.push({
        node_id: node.id,
        node_label: node.label,
        status,
        input: truncateForLog(nodeInput),
        output: truncateForLog(output),
        error: errorMessage,
        duration_ms: Date.now() - startedNodeAt,
        timestamp: new Date().toISOString()
      });

      if (executionId) {
        await updateExecutionLogs(supabaseServiceClient, executionId, executionLogs);
      }

      if (status === "failed" && CRITICAL_NODE_TYPES.has(node.type)) {
        break;
      }
    }

    finalStatus = executionLogs.some((log) => log.status === "failed")
      ? "failed"
      : "success";
  } catch (error) {
    finalStatus = "failed";
    finalErrorMessage =
      error instanceof Error
        ? error.message
        : "워크플로우 실행 중 오류가 발생했습니다.";
  } finally {
    const finishedAt = new Date().toISOString();

    if (executionId) {
      await supabaseServiceClient
        .from("workflow_executions")
        .update({
          status: finalStatus,
          finished_at: finishedAt,
          logs: executionLogs,
          error_message: finalErrorMessage
        })
        .eq("id", executionId);
    }

    if (workflow) {
      await supabaseServiceClient
        .from("workflows")
        .update({
          last_executed_at: finishedAt
        })
        .eq("id", workflow.id)
        .eq("user_id", userId);
    }
  }

  if (!executionId || !workflow) {
    throw new Error(finalErrorMessage || "워크플로우 실행을 시작하지 못했습니다.");
  }

  return {
    id: executionId,
    workflow_id: workflow.id,
    user_id: userId,
    status: finalStatus,
    trigger_type: triggerType,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    logs: executionLogs,
    error_message: finalErrorMessage
  };
}
