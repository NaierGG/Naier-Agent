import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStoredUserApiKeys,
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
    let geminiApiKey = inputKeys.gemini_api_key || null;

    if (!geminiApiKey) {
      const adminClient = createSupabaseAdminClient();
      const storedKeys = await getStoredUserApiKeys(adminClient, user.id);
      geminiApiKey = storedKeys?.gemini_api_key || null;
    }

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Gemini API \uD0A4\uB97C \uBA3C\uC800 \uC785\uB825\uD558\uAC70\uB098 \uC800\uC7A5\uD574\uC8FC\uC138\uC694."
        },
        { status: 400 }
      );
    }

    const client = new GoogleGenerativeAI(geminiApiKey);
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(
      "\uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uC785\uB2C8\uB2E4. \uD55C\uAD6D\uC5B4\uB85C \u2018\uc5f0\uacb0 \uc131\uacf5\u2019\uC774\uB77C\uACE0 \uC9E7\uAC8C \uB2F5\uD574\uC8FC\uC138\uC694."
    );

    const text = result.response.text();

    return NextResponse.json({
      success: true,
      message: text || "Gemini API \uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uC5D0 \uC131\uACF5\uD588\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gemini API \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      },
      { status: 500 }
    );
  }
}
