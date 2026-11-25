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

  const baseUrl =
    process.env.DIFY_BASE_URL?.replace(/\/$/, "");

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
    const response = await fetch(
      `${baseUrl}/chat-messages`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },

        body: JSON.stringify({
          inputs: {
            learner_email: learnerEmail,
          },

          query: message,
          response_mode: "streaming",
          conversation_id: body.conversationId || "",
          user: difyUser,
        }),

        cache: "no-store",
      }
    );

    if (!response.ok) {
      const raw = await response.text();

      console.error("Dify request failed", {
        status: response.status,
        contentType:
          response.headers.get("content-type") || "",
        body: raw.slice(0, 2000),
      });

      return NextResponse.json(
        {
          error:
            `Dify returned HTTP ${response.status}.`,
        },
        { status: 502 }
      );
    }

    if (!response.body) {
      console.error(
        "Dify returned no response stream."
      );

      return NextResponse.json(
        {
          error:
            "The assistant service returned no response stream.",
        },
        { status: 502 }
      );
    }

    /*
      Dify streaming mode returns Server-Sent Events (SSE).

      Do NOT call response.json() or response.text()
      for successful requests.

      Pass the stream directly to the browser.
    */
    return new Response(response.body, {
      status: 200,

      headers: {
        "Content-Type":
          "text/event-stream; charset=utf-8",

        "Cache-Control":
          "no-cache, no-transform",

        Connection:
          "keep-alive",

        "X-Accel-Buffering":
          "no",
      },
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