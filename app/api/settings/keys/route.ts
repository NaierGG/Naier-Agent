import { NextResponse } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatUserApiKeysForClient,
  getStoredUserApiKeys,
  getUserApiKeyStatus,
  normalizeUserApiKeyInput
} from "@/lib/settings/user-api-keys";

export const runtime = "nodejs";

async function getAuthenticatedUser() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!user) {
    return null;
  }

  return user;
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." },
        { status: 401 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const storedKeys = await getStoredUserApiKeys(adminClient, user.id);

    return NextResponse.json({
      success: true,
      keys: formatUserApiKeysForClient(storedKeys),
      connectionStatus: getUserApiKeyStatus(storedKeys)
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "\uC124\uC815 \uC815\uBCF4\uB97C \uAC00\uC838\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const normalizedKeys = normalizeUserApiKeyInput(payload);

    if (Object.keys(normalizedKeys).length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "\uC800\uC7A5\uD560 \uAC12\uC744 \uD558\uB098 \uC774\uC0C1 \uC785\uB825\uD574\uC8FC\uC138\uC694."
        },
        { status: 400 }
      );
    }

    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
      .from("user_api_keys")
      .upsert(
        {
          user_id: user.id,
          ...normalizedKeys,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: "user_id"
        }
      )
      .select(
        "gemini_api_key, dart_api_key, telegram_bot_token, telegram_chat_id, discord_webhook_url, email_smtp_host, email_smtp_port, email_smtp_user, email_smtp_pass, email_to"
      )
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: "\uC124\uC815\uC774 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
      keys: formatUserApiKeysForClient(data),
      connectionStatus: getUserApiKeyStatus(data)
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "\uC124\uC815 \uC800\uC7A5\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.";

    return NextResponse.json(
      { success: false, message },
      { status: message.includes("SMTP") ? 400 : 500 }
    );
  }
}
