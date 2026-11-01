import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { developmentUser, isAuthDisabled } from "@/lib-auth-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatRequest = {
  message?: string;
  learnerEmail?: string;
  conversationId?: string;
};

type DifyResponse = {
  answer?: string;
  conversation_id?: string;
  message_id?: string;
  error?: string;
  message?: string;
};

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: Request) {
  const session = isAuthDisabled ? null : await auth();

  if (!isAuthDisabled && !session?.user) {
    return NextResponse.json(
      { error: "You must sign in before using CheckOnIt." },
      { status: 401 }
    );
  }

  const body = (await request.json()) as ChatRequest;

  const message = body.message?.trim();
  const learnerEmail = body.learnerEmail?.trim();

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 }
    );
  }

  if (!learnerEmail || !isEmail(learnerEmail)) {
    return NextResponse.json(
      {
        error:
          "A valid learner email is required before starting the chat.",
      },
      { status: 400 }
    );
  }

  const baseUrl = process.env.DIFY_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.DIFY_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json(
      {
        error:
          "Dify is not configured on the CheckOnIt server.",
      },
      { status: 500 }
    );
  }

  const difyUser = isAuthDisabled
    ? developmentUser.staffId
    : session?.user.staffId ||
      session?.user.staffEmail ||
      session?.user.email ||
      "checkonit-staff";

  try {
    const response = await fetch(`${baseUrl}/chat-messages`, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        inputs: {
          learner_email: learnerEmail,
        },

        query: message,
        response_mode: "blocking",
        conversation_id: body.conversationId || "",
        user: difyUser,
      }),

      cache: "no-store",
    });

    const data = (await response.json()) as DifyResponse;

    if (!response.ok) {
      console.error(
        "Dify request failed",
        response.status,
        data
      );

      return NextResponse.json(
        {
          error:
            data.message ||
            data.error ||
            `Dify returned HTTP ${response.status}.`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer:
        data.answer ||
        "I do not have a response for that request.",

      conversationId:
        data.conversation_id ||
        body.conversationId ||
        "",

      messageId:
        data.message_id || "",
    });
  } catch (error) {
    console.error("Unable to reach Dify", error);

    return NextResponse.json(
      {
        error:
          "CheckOnIt could not reach the assistant service. Confirm that Dify is running and DIFY_BASE_URL is correct.",
      },
      { status: 502 }
    );
  }
}
