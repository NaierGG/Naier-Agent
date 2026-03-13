import { NextResponse } from "next/server";

import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStoredUserApiKeys,
  normalizeUserApiKeyInput
} from "@/lib/settings/user-api-keys";

export const runtime = "nodejs";

type DartCompanyResponse = {
  status?: string;
  message?: string;
  corp_name?: string;
};

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
    let dartApiKey = inputKeys.dart_api_key || null;

    if (!dartApiKey) {
      const adminClient = createSupabaseAdminClient();
      const storedKeys = await getStoredUserApiKeys(adminClient, user.id);
      dartApiKey = storedKeys?.dart_api_key || null;
    }

    if (!dartApiKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "DART API \uD0A4\uB97C \uBA3C\uC800 \uC785\uB825\uD558\uAC70\uB098 \uC800\uC7A5\uD574\uC8FC\uC138\uC694."
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://opendart.fss.or.kr/api/company.json?crtfc_key=${encodeURIComponent(
        dartApiKey
      )}&corp_code=00126380`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        }
      }
    );

    const result = (await response.json()) as DartCompanyResponse;

    if (!response.ok || result.status !== "000") {
      return NextResponse.json(
        {
          success: false,
          message:
            result.message ||
            "DART API \uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `DART API \uC5F0\uACB0 \uC131\uACF5 (${result.corp_name || "company"})`
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "DART API \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      },
      { status: 500 }
    );
  }
}
