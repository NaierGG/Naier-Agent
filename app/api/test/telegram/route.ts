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

    if (!mergedKeys.telegram_bot_token || !mergedKeys.telegram_chat_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "\uD154\uB808\uADF8\uB7A8 Bot Token\uACFC Chat ID\uB97C \uBA3C\uC800 \uC785\uB825\uD574\uC8FC\uC138\uC694."
        },
        { status: 400 }
      );
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${mergedKeys.telegram_bot_token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: mergedKeys.telegram_chat_id,
          text: "\u2705 Naier \uD154\uB808\uADF8\uB7A8 \uC5F0\uACB0 \uD14C\uC2A4\uD2B8 \uC131\uACF5!",
          parse_mode: "Markdown"
        })
      }
    );

    const telegramJson = (await telegramResponse.json()) as {
      ok?: boolean;
      description?: string;
    };

    if (!telegramResponse.ok || telegramJson.ok === false) {
      return NextResponse.json(
        {
          success: false,
          message:
            telegramJson.description ||
            "\uD154\uB808\uADF8\uB7A8 \uBA54\uC2DC\uC9C0 \uC804\uC1A1\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "\uD154\uB808\uADF8\uB7A8 \uD14C\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0\uB97C \uC131\uACF5\uC801\uC73C\uB85C \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "\uD154\uB808\uADF8\uB7A8 \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      },
      { status: 500 }
    );
  }
}
