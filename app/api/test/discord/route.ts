import { NextResponse } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStoredUserApiKeys,
  mergeKeysWithFallback,
  normalizeUserApiKeyInput
} from "@/lib/settings/user-api-keys";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const inputKeys = normalizeUserApiKeyInput(payload);
    const adminClient = createSupabaseAdminClient();
    const storedKeys = await getStoredUserApiKeys(adminClient, user.id);
    const mergedKeys = mergeKeysWithFallback(inputKeys, storedKeys);

    if (!mergedKeys.discord_webhook_url) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Discord Webhook URL\uC744 \uBA3C\uC800 \uC785\uB825\uD558\uAC70\uB098 \uC800\uC7A5\uD574\uC8FC\uC138\uC694."
        },
        { status: 400 }
      );
    }

    const discordResponse = await fetch(mergedKeys.discord_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: "\u2705 Naier \uB514\uC2A4\uCF54\uB4DC \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \uC131\uACF5!"
      })
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();

      return NextResponse.json(
        {
          success: false,
          message:
            errorText ||
            "Discord Webhook \uD638\uCD9C\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "\uB514\uC2A4\uCF54\uB4DC \uD14C\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0\uB97C \uC131\uACF5\uC801\uC73C\uB85C \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Discord \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      },
      { status: 500 }
    );
  }
}
