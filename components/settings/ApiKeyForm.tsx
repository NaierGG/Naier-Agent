"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bot,
  Database,
  LoaderCircle,
  Mail,
  RefreshCcw,
  Send,
  ShieldCheck
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserApiKeys } from "@/types";

type TabId = "ai" | "market" | "notifications" | "email";
type TestTarget = "gemini" | "dart" | "telegram" | "discord" | "email";

type ConnectionStatus = {
  gemini: boolean;
  dart: boolean;
  telegram: boolean;
  discord: boolean;
  email: boolean;
};

type Notice = {
  variant: "default" | "destructive" | "success";
  title: string;
  message: string;
};

type SettingsResponse = {
  success: boolean;
  message?: string;
  keys: UserApiKeys;
  connectionStatus: ConnectionStatus;
};

const initialFormValues = {
  gemini_api_key: "",
  dart_api_key: "",
  telegram_bot_token: "",
  telegram_chat_id: "",
  discord_webhook_url: "",
  email_smtp_host: "",
  email_smtp_port: "",
  email_smtp_user: "",
  email_smtp_pass: "",
  email_to: ""
};

const initialConnectionStatus: ConnectionStatus = {
  gemini: false,
  dart: false,
  telegram: false,
  discord: false,
  email: false
};

const tabs: Array<{
  id: TabId;
  label: string;
  description: string;
  icon: typeof Bot;
}> = [
  {
    id: "ai",
    label: "AI \uC124\uC815",
    description: "Gemini API \uD0A4",
    icon: Bot
  },
  {
    id: "market",
    label: "\uC8FC\uC2DD \uB370\uC774\uD130",
    description: "DART Open API",
    icon: Database
  },
  {
    id: "notifications",
    label: "\uC54C\uB9BC \uC124\uC815",
    description: "Telegram / Discord",
    icon: Send
  },
  {
    id: "email",
    label: "\uC774\uBA54\uC77C \uC54C\uB9BC",
    description: "SMTP",
    icon: Mail
  }
];

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
        connected
          ? "bg-emerald-500/15 text-emerald-200"
          : "bg-zinc-700/40 text-zinc-300"
      }`}
    >
      {connected ? "\u2705 \uC5F0\uACB0\uB428" : "\u26A0\uFE0F \uBBF8\uC124\uC815"}
    </span>
  );
}

function StoredValueHint({
  label,
  value
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <p className="text-xs text-zinc-500">
      {label}: <span className="font-mono text-zinc-300">{value}</span>
    </p>
  );
}

function ExternalHelperLink({
  href,
  children
}: {
  href: string;
  children: string;
}) {
  return (
    <a
      className="text-sm text-[#7ef5da] hover:text-[#00d4aa]"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {children}
    </a>
  );
}

function getTabStatus(tab: TabId, status: ConnectionStatus) {
  switch (tab) {
    case "ai":
      return status.gemini;
    case "market":
      return status.dart;
    case "notifications":
      return status.telegram || status.discord;
    case "email":
      return status.email;
    default:
      return false;
  }
}

export function ApiKeyForm() {
  const [activeTab, setActiveTab] = useState<TabId>("ai");
  const [formValues, setFormValues] = useState(initialFormValues);
  const [storedKeys, setStoredKeys] = useState<UserApiKeys>({});
  const [status, setStatus] = useState<ConnectionStatus>(initialConnectionStatus);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<TabId | null>(null);
  const [testingTarget, setTestingTarget] = useState<TestTarget | null>(null);

  const activeTabStatus = useMemo(
    () => getTabStatus(activeTab, status),
    [activeTab, status]
  );

  const loadSettings = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/keys", {
        method: "GET",
        cache: "no-store"
      });
      const result = (await response.json()) as SettingsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "\uC124\uC815 \uC815\uBCF4\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
        );
      }

      setStoredKeys(result.keys);
      setStatus(result.connectionStatus);
      setFormValues((current) => ({
        ...current,
        gemini_api_key: "",
        dart_api_key: "",
        telegram_bot_token: "",
        telegram_chat_id: result.keys.telegram_chat_id || "",
        discord_webhook_url: "",
        email_smtp_host: result.keys.email_smtp_host || "",
        email_smtp_port: result.keys.email_smtp_port
          ? String(result.keys.email_smtp_port)
          : "",
        email_smtp_user: result.keys.email_smtp_user || "",
        email_smtp_pass: "",
        email_to: result.keys.email_to || ""
      }));
    } catch (error) {
      setNotice({
        variant: "destructive",
        title: "\uC124\uC815 \uB85C\uB4DC \uC624\uB958",
        message:
          error instanceof Error
            ? error.message
            : "\uC124\uC815 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateField(name: keyof typeof initialFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  function getSavePayload(tab: TabId) {
    switch (tab) {
      case "ai":
        return {
          gemini_api_key: formValues.gemini_api_key
        };
      case "market":
        return {
          dart_api_key: formValues.dart_api_key
        };
      case "notifications":
        return {
          telegram_bot_token: formValues.telegram_bot_token,
          telegram_chat_id: formValues.telegram_chat_id,
          discord_webhook_url: formValues.discord_webhook_url
        };
      case "email":
        return {
          email_smtp_host: formValues.email_smtp_host,
          email_smtp_port: formValues.email_smtp_port,
          email_smtp_user: formValues.email_smtp_user,
          email_smtp_pass: formValues.email_smtp_pass,
          email_to: formValues.email_to
        };
      default:
        return {};
    }
  }

  async function saveSection(tab: TabId) {
    if (tab === "ai" && !formValues.gemini_api_key.trim()) {
      setNotice({
        variant: "default",
        title: "\uC800\uC7A5\uD560 \uB0B4\uC6A9 \uC5C6\uC74C",
        message: status.gemini
          ? "\uC774\uBBF8 Gemini API \uD0A4\uAC00 \uC800\uC7A5\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uAD50\uCCB4\uD560 \uACBD\uC6B0 \uC0C8 \uD0A4\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
          : "Gemini API \uD0A4\uB97C \uC785\uB825\uD55C \uB4A4 \uC800\uC7A5\uD574\uC8FC\uC138\uC694."
      });
      return;
    }

    if (tab === "market" && !formValues.dart_api_key.trim()) {
      setNotice({
        variant: "default",
        title: "\uC800\uC7A5\uD560 \uB0B4\uC6A9 \uC5C6\uC74C",
        message: status.dart
          ? "\uC774\uBBF8 DART API \uD0A4\uAC00 \uC800\uC7A5\uB418\uC5B4 \uC788\uC2B5\uB2C8\uB2E4. \uAD50\uCCB4\uD560 \uACBD\uC6B0 \uC0C8 \uD0A4\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694."
          : "DART API \uD0A4\uB97C \uC785\uB825\uD55C \uB4A4 \uC800\uC7A5\uD574\uC8FC\uC138\uC694."
      });
      return;
    }

    setSavingSection(tab);
    setNotice(null);

    try {
      const response = await fetch("/api/settings/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(getSavePayload(tab))
      });
      const result = (await response.json()) as SettingsResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "\uC124\uC815 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
        );
      }

      setNotice({
        variant: "success",
        title: "\uC800\uC7A5 \uC644\uB8CC",
        message:
          result.message ||
          "\uC124\uC815\uC774 \uC131\uACF5\uC801\uC73C\uB85C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
      });

      await loadSettings();
    } catch (error) {
      setNotice({
        variant: "destructive",
        title: "\uC800\uC7A5 \uC624\uB958",
        message:
          error instanceof Error
            ? error.message
            : "\uC124\uC815 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      });
    } finally {
      setSavingSection(null);
    }
  }

  function getTestRequest(target: TestTarget) {
    switch (target) {
      case "gemini":
        return {
          endpoint: "/api/test/gemini",
          payload: {
            gemini_api_key: formValues.gemini_api_key
          }
        };
      case "dart":
        return {
          endpoint: "/api/test/dart",
          payload: {
            dart_api_key: formValues.dart_api_key
          }
        };
      case "telegram":
        return {
          endpoint: "/api/test/telegram",
          payload: {
            telegram_bot_token: formValues.telegram_bot_token,
            telegram_chat_id: formValues.telegram_chat_id
          }
        };
      case "discord":
        return {
          endpoint: "/api/test/discord",
          payload: {
            discord_webhook_url: formValues.discord_webhook_url
          }
        };
      case "email":
        return {
          endpoint: "/api/test/email",
          payload: {
            email_smtp_host: formValues.email_smtp_host,
            email_smtp_port: formValues.email_smtp_port,
            email_smtp_user: formValues.email_smtp_user,
            email_smtp_pass: formValues.email_smtp_pass,
            email_to: formValues.email_to
          }
        };
      default:
        return {
          endpoint: "",
          payload: {}
        };
    }
  }

  async function runTest(target: TestTarget) {
    setTestingTarget(target);
    setNotice(null);

    try {
      const requestConfig = getTestRequest(target);
      const response = await fetch(requestConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestConfig.payload)
      });
      const result = (await response.json()) as {
        success: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "\uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
        );
      }

      setNotice({
        variant: "success",
        title: "\uD14C\uC2A4\uD2B8 \uC131\uACF5",
        message:
          result.message ||
          "\uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uAC00 \uC131\uACF5\uD588\uC2B5\uB2C8\uB2E4."
      });
    } catch (error) {
      setNotice({
        variant: "destructive",
        title: "\uD14C\uC2A4\uD2B8 \uC624\uB958",
        message:
          error instanceof Error
            ? error.message
            : "\uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      });
    } finally {
      setTestingTarget(null);
    }
  }

  return (
    <div className="space-y-6">
      {notice ? (
        <Alert variant={notice.variant}>
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const connected = getTabStatus(tab.id, status);

          return (
            <button
              key={tab.id}
              className={`rounded-2xl border p-4 text-left transition ${
                activeTab === tab.id
                  ? "border-[#00d4aa]/40 bg-[#00d4aa]/10"
                  : "border-white/10 bg-[#111111] hover:border-white/20"
              }`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black/20 text-[#00d4aa]">
                  <Icon className="h-5 w-5" />
                </div>
                <StatusBadge connected={connected} />
              </div>
              <p className="mt-4 font-mono text-base text-zinc-100">{tab.label}</p>
              <p className="mt-1 text-sm text-zinc-400">{tab.description}</p>
            </button>
          );
        })}
      </div>

      <Card className="border-white/10 bg-[#111111]">
        <CardHeader className="border-b border-white/10 pb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">
                {tabs.find((tab) => tab.id === activeTab)?.label}
              </CardTitle>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {
                  "\uD0A4\uB294 \uC11C\uBC84 \uCE21\uC5D0\uC11C\uB9CC \uCC98\uB9AC\uB418\uBA70, GET \uC751\uB2F5\uC5D0\uC11C\uB294 \uB9C8\uC2A4\uD0B9 \uC0C1\uD0DC\uB85C\uB9CC \uD45C\uC2DC\uB429\uB2C8\uB2E4."
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge connected={activeTabStatus} />
              <Button
                variant="outline"
                onClick={() => void loadSettings()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                {"\uC0C8\uB85C\uACE0\uCE68"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          {isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-8 text-sm text-zinc-400">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {"\uC800\uC7A5\uB41C \uC124\uC815\uC744 \uBD88\uB7EC\uC624\uB294 \uC911..."}
            </div>
          ) : null}

          {!isLoading && activeTab === "ai" ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <div className="space-y-2">
                  <Label htmlFor="gemini_api_key">Gemini API Key</Label>
                  <Input
                    id="gemini_api_key"
                    type="password"
                    placeholder="AIza..."
                    value={formValues.gemini_api_key}
                    onChange={(event) =>
                      updateField("gemini_api_key", event.target.value)
                    }
                  />
                  <StoredValueHint
                    label="\uD604\uC7AC \uC800\uC7A5\uB41C \uD0A4"
                    value={storedKeys.gemini_api_key}
                  />
                  <ExternalHelperLink href="https://aistudio.google.com">
                    Google AI Studio\uC5D0\uC11C \uBC1C\uAE09
                  </ExternalHelperLink>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void saveSection("ai")}
                  disabled={savingSection === "ai"}
                >
                  {savingSection === "ai" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {"\uC800\uC7A5"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void runTest("gemini")}
                  disabled={testingTarget === "gemini"}
                >
                  {testingTarget === "gemini" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {"\uC5F0\uACB0 \uD14C\uC2A4\uD2B8"}
                </Button>
              </div>
            </div>
          ) : null}

          {!isLoading && activeTab === "market" ? (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                <div className="space-y-2">
                  <Label htmlFor="dart_api_key">DART API Key</Label>
                  <Input
                    id="dart_api_key"
                    type="password"
                    placeholder="DART key"
                    value={formValues.dart_api_key}
                    onChange={(event) =>
                      updateField("dart_api_key", event.target.value)
                    }
                  />
                  <StoredValueHint
                    label="\uD604\uC7AC \uC800\uC7A5\uB41C \uD0A4"
                    value={storedKeys.dart_api_key}
                  />
                  <ExternalHelperLink href="https://opendart.fss.or.kr">
                    DART Open API \uC2E0\uCCAD
                  </ExternalHelperLink>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void saveSection("market")}
                  disabled={savingSection === "market"}
                >
                  {savingSection === "market" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {"\uC800\uC7A5"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void runTest("dart")}
                  disabled={testingTarget === "dart"}
                >
                  {testingTarget === "dart" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {"\uC5F0\uACB0 \uD14C\uC2A4\uD2B8"}
                </Button>
              </div>
            </div>
          ) : null}

          {!isLoading && activeTab === "notifications" ? (
            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-mono text-base text-zinc-100">Telegram</p>
                    <StatusBadge connected={status.telegram} />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="telegram_bot_token">
                        Telegram Bot Token
                      </Label>
                      <Input
                        id="telegram_bot_token"
                        type="password"
                        placeholder="123456:ABCDEF..."
                        value={formValues.telegram_bot_token}
                        onChange={(event) =>
                          updateField("telegram_bot_token", event.target.value)
                        }
                      />
                      <StoredValueHint
                        label="\uC800\uC7A5\uB41C Bot Token"
                        value={storedKeys.telegram_bot_token}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telegram_chat_id">Telegram Chat ID</Label>
                      <Input
                        id="telegram_chat_id"
                        placeholder="123456789"
                        value={formValues.telegram_chat_id}
                        onChange={(event) =>
                          updateField("telegram_chat_id", event.target.value)
                        }
                      />
                      <StoredValueHint
                        label="\uC800\uC7A5\uB41C Chat ID"
                        value={storedKeys.telegram_chat_id}
                      />
                    </div>
                    <p className="text-sm text-zinc-400">
                      @BotFather\uC5D0\uC11C \uBD07\uC744 \uC0DD\uC131\uD55C \uD6C4
                      \uD1A0\uD070\uC744 \uBC1C\uAE09\uBC1B\uC73C\uC138\uC694.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => void runTest("telegram")}
                      disabled={testingTarget === "telegram"}
                    >
                      {testingTarget === "telegram" ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : null}
                      {"\uD14C\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0 \uC804\uC1A1"}
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-mono text-base text-zinc-100">Discord</p>
                    <StatusBadge connected={status.discord} />
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="discord_webhook_url">Discord Webhook URL</Label>
                      <Input
                        id="discord_webhook_url"
                        type="password"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={formValues.discord_webhook_url}
                        onChange={(event) =>
                          updateField("discord_webhook_url", event.target.value)
                        }
                      />
                      <StoredValueHint
                        label="\uC800\uC7A5\uB41C Webhook"
                        value={storedKeys.discord_webhook_url}
                      />
                    </div>
                    <p className="text-sm text-zinc-400">
                      Discord \uCC44\uB110 Webhook URL\uC744 \uB4F1\uB85D\uD558\uBA74
                      \uC989\uC2DC \uD14C\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0\uB97C \uBCF4\uB0BC
                      \uC218 \uC788\uC2B5\uB2C8\uB2E4.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => void runTest("discord")}
                      disabled={testingTarget === "discord"}
                    >
                      {testingTarget === "discord" ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : null}
                      {"\uD14C\uC2A4\uD2B8 \uC804\uC1A1"}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => void saveSection("notifications")}
                disabled={savingSection === "notifications"}
              >
                {savingSection === "notifications" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {"\uC54C\uB9BC \uC124\uC815 \uC800\uC7A5"}
              </Button>
            </div>
          ) : null}

          {!isLoading && activeTab === "email" ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email_smtp_host">SMTP Host</Label>
                  <Input
                    id="email_smtp_host"
                    placeholder="smtp.gmail.com"
                    value={formValues.email_smtp_host}
                    onChange={(event) =>
                      updateField("email_smtp_host", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_smtp_port">SMTP Port</Label>
                  <Input
                    id="email_smtp_port"
                    inputMode="numeric"
                    placeholder="587"
                    value={formValues.email_smtp_port}
                    onChange={(event) =>
                      updateField("email_smtp_port", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_smtp_user">SMTP User</Label>
                  <Input
                    id="email_smtp_user"
                    placeholder="you@gmail.com"
                    value={formValues.email_smtp_user}
                    onChange={(event) =>
                      updateField("email_smtp_user", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_to">
                    {"\uBC1B\uB294 \uC774\uBA54\uC77C"}
                  </Label>
                  <Input
                    id="email_to"
                    placeholder="alerts@example.com"
                    value={formValues.email_to}
                    onChange={(event) => updateField("email_to", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email_smtp_pass">SMTP Password</Label>
                <Input
                  id="email_smtp_pass"
                  type="password"
                  placeholder="App Password"
                  value={formValues.email_smtp_pass}
                  onChange={(event) =>
                    updateField("email_smtp_pass", event.target.value)
                  }
                />
                <StoredValueHint
                  label="\uC800\uC7A5\uB41C SMTP Password"
                  value={storedKeys.email_smtp_pass}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-zinc-400">
                SMTP Host, Port, User, Password, \uBC1B\uB294 \uC774\uBA54\uC77C\uC744
                \uBAA8\uB450 \uC800\uC7A5\uD558\uBA74 \uD14C\uC2A4\uD2B8 \uC774\uBA54\uC77C\uC744
                \uBCF4\uB0BC \uC218 \uC788\uC2B5\uB2C8\uB2E4.
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => void saveSection("email")}
                  disabled={savingSection === "email"}
                >
                  {savingSection === "email" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {"\uC800\uC7A5"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void runTest("email")}
                  disabled={testingTarget === "email"}
                >
                  {testingTarget === "email" ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  {"\uD14C\uC2A4\uD2B8 \uC774\uBA54\uC77C \uC804\uC1A1"}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
