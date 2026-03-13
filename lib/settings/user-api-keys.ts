import type { SupabaseClient } from "@supabase/supabase-js";

import type { UserApiKeys } from "@/types";

export const SECRET_USER_API_KEY_FIELDS = [
  "gemini_api_key",
  "dart_api_key",
  "telegram_bot_token",
  "discord_webhook_url",
  "email_smtp_pass"
] as const;

export const PLAIN_USER_API_KEY_FIELDS = [
  "telegram_chat_id",
  "email_smtp_host",
  "email_smtp_user",
  "email_to"
] as const;

export const NUMBER_USER_API_KEY_FIELDS = ["email_smtp_port"] as const;

export type UserApiKeyStatus = {
  gemini: boolean;
  dart: boolean;
  telegram: boolean;
  discord: boolean;
  email: boolean;
};

export type StoredUserApiKeys = Partial<UserApiKeys> | null;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function maskSensitiveValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= 4) {
    return trimmed;
  }

  return `${"*".repeat(Math.max(4, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

export function formatUserApiKeysForClient(keys: StoredUserApiKeys): UserApiKeys {
  return {
    gemini_api_key: maskSensitiveValue(keys?.gemini_api_key),
    dart_api_key: maskSensitiveValue(keys?.dart_api_key),
    telegram_bot_token: maskSensitiveValue(keys?.telegram_bot_token),
    telegram_chat_id: keys?.telegram_chat_id ?? null,
    discord_webhook_url: maskSensitiveValue(keys?.discord_webhook_url),
    email_smtp_host: keys?.email_smtp_host ?? null,
    email_smtp_port: keys?.email_smtp_port ?? null,
    email_smtp_user: keys?.email_smtp_user ?? null,
    email_smtp_pass: maskSensitiveValue(keys?.email_smtp_pass),
    email_to: keys?.email_to ?? null
  };
}

export function getUserApiKeyStatus(keys: StoredUserApiKeys): UserApiKeyStatus {
  return {
    gemini: Boolean(keys?.gemini_api_key),
    dart: Boolean(keys?.dart_api_key),
    telegram: Boolean(keys?.telegram_bot_token && keys?.telegram_chat_id),
    discord: Boolean(keys?.discord_webhook_url),
    email: Boolean(
      keys?.email_smtp_host &&
        keys?.email_smtp_port &&
        keys?.email_smtp_user &&
        keys?.email_smtp_pass &&
        keys?.email_to
    )
  };
}

export function normalizeUserApiKeyInput(
  input: Record<string, unknown>
): Partial<UserApiKeys> {
  const normalized: Partial<UserApiKeys> = {};

  for (const field of SECRET_USER_API_KEY_FIELDS) {
    const value = input[field];

    if (isNonEmptyString(value)) {
      normalized[field] = value.trim();
    }
  }

  for (const field of PLAIN_USER_API_KEY_FIELDS) {
    if (!(field in input)) {
      continue;
    }

    const value = input[field];
    normalized[field] = isNonEmptyString(value) ? value.trim() : null;
  }

  if ("email_smtp_port" in input) {
    const rawValue = input.email_smtp_port;

    if (rawValue === null || rawValue === undefined || rawValue === "") {
      normalized.email_smtp_port = null;
    } else {
      const parsedValue =
        typeof rawValue === "number" ? rawValue : Number.parseInt(String(rawValue), 10);

      if (
        Number.isNaN(parsedValue) ||
        parsedValue < 1 ||
        parsedValue > 65535
      ) {
        throw new Error(
          "\uC774\uBA54\uC77C SMTP \uD3EC\uD2B8\uB294 1~65535 \uBC94\uC704\uC758 \uC22B\uC790\uC5EC\uC57C \uD569\uB2C8\uB2E4."
        );
      }

      normalized.email_smtp_port = parsedValue;
    }
  }

  return normalized;
}

export async function getStoredUserApiKeys(
  adminClient: SupabaseClient,
  userId: string
): Promise<StoredUserApiKeys> {
  const { data, error } = await adminClient
    .from("user_api_keys")
    .select(
      "gemini_api_key, dart_api_key, telegram_bot_token, telegram_chat_id, discord_webhook_url, email_smtp_host, email_smtp_port, email_smtp_user, email_smtp_pass, email_to"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export function mergeKeysWithFallback(
  overrides: Partial<UserApiKeys>,
  storedKeys: StoredUserApiKeys
): UserApiKeys {
  return {
    gemini_api_key: overrides.gemini_api_key || storedKeys?.gemini_api_key || null,
    dart_api_key: overrides.dart_api_key || storedKeys?.dart_api_key || null,
    telegram_bot_token:
      overrides.telegram_bot_token || storedKeys?.telegram_bot_token || null,
    telegram_chat_id:
      overrides.telegram_chat_id || storedKeys?.telegram_chat_id || null,
    discord_webhook_url:
      overrides.discord_webhook_url || storedKeys?.discord_webhook_url || null,
    email_smtp_host:
      overrides.email_smtp_host || storedKeys?.email_smtp_host || null,
    email_smtp_port:
      overrides.email_smtp_port || storedKeys?.email_smtp_port || null,
    email_smtp_user:
      overrides.email_smtp_user || storedKeys?.email_smtp_user || null,
    email_smtp_pass:
      overrides.email_smtp_pass || storedKeys?.email_smtp_pass || null,
    email_to: overrides.email_to || storedKeys?.email_to || null
  };
}
