import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

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

    if (
      !mergedKeys.email_smtp_host ||
      !mergedKeys.email_smtp_port ||
      !mergedKeys.email_smtp_user ||
      !mergedKeys.email_smtp_pass ||
      !mergedKeys.email_to
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "\uC774\uBA54\uC77C \uD14C\uC2A4\uD2B8\uB97C \uC704\uD574 SMTP Host, Port, User, Password, \uBC1B\uB294 \uC774\uBA54\uC77C\uC744 \uBAA8\uB450 \uC785\uB825\uD574\uC8FC\uC138\uC694."
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: mergedKeys.email_smtp_host,
      port: mergedKeys.email_smtp_port,
      secure: mergedKeys.email_smtp_port === 465,
      auth: {
        user: mergedKeys.email_smtp_user,
        pass: mergedKeys.email_smtp_pass
      }
    });

    await transporter.sendMail({
      from: mergedKeys.email_smtp_user,
      to: mergedKeys.email_to,
      subject: "StockFlow AI \uC774\uBA54\uC77C \uC5F0\uACB0 \uD14C\uC2A4\uD2B8",
      text: "\u2705 StockFlow AI \uC774\uBA54\uC77C \uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uAC00 \uC131\uACF5\uD588\uC2B5\uB2C8\uB2E4.",
      html: "<p>\u2705 <strong>StockFlow AI</strong> \uC774\uBA54\uC77C \uC5F0\uACB0 \uD14C\uC2A4\uD2B8\uAC00 \uC131\uACF5\uD588\uC2B5\uB2C8\uB2E4.</p>"
    });

    return NextResponse.json({
      success: true,
      message:
        "\uD14C\uC2A4\uD2B8 \uC774\uBA54\uC77C\uC744 \uC131\uACF5\uC801\uC73C\uB85C \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4."
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "\uC774\uBA54\uC77C \uD14C\uC2A4\uD2B8\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
      },
      { status: 500 }
    );
  }
}
