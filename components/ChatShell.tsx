"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  staffName: string;
  staffEmail: string;
  authDisabled?: boolean;
};

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function ChatShell({
  staffName,
  staffEmail,
  authDisabled = false,
}: Props) {
  const [learnerDraft, setLearnerDraft] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [learnerError, setLearnerError] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showTopics, setShowTopics] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const staffLabel = authDisabled
    ? "Local development"
    : staffName || staffEmail || "Staff";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "auto",
    });
  }, [messages, isSending]);

  useEffect(() => {
    const orbs = Array.from(
      document.querySelectorAll<HTMLElement>(".ambient-orb")
    );

    type OrbState = {
      el: HTMLElement;

      x: number;
      y: number;

      vx: number;
      vy: number;

      targetVx: number;
      targetVy: number;

      scale: number;

      nextChange: number;

      minX: number;
      maxX: number;

      minY: number;
      maxY: number;

      baseRect: DOMRect;
    };

    const states: OrbState[] = orbs.map((el, index) => {
      /*
       * Read the orb's original position
       * BEFORE movement begins.
       */
      const baseRect = el.getBoundingClientRect();

      const width = baseRect.width;
      const height = baseRect.height;

      /*
       * At least HALF of the orb must remain visible.
       */
      const minX =
        width / 2 - baseRect.right;

      const maxX =
        window.innerWidth -
        width / 2 -
        baseRect.left;

      const minY =
        height / 2 - baseRect.bottom;

      const maxY =
        window.innerHeight -
        height / 2 -
        baseRect.top;





      return {
        el,

        x: 0,
        y: 0,

        vx:
          (Math.random() - 0.5) * 0.045,

        vy:
          (Math.random() - 0.5) * 0.036,

        targetVx:
          (Math.random() - 0.5) * 0.045,

        targetVy:
          (Math.random() - 0.5) * 0.036,

        scale:
          0.96 +
          Math.random() * 0.08,

        nextChange:
          performance.now() +
          2000 +
          Math.random() * 3500 +
          index * 250,

        minX,
        maxX,

        minY,
        maxY,

        baseRect,
      };
    });

    let animationFrame = 0;
    let previousTime = performance.now();

    const updateBounds = () => {
      states.forEach((orb) => {
        const width = orb.baseRect.width;
        const height = orb.baseRect.height;

        orb.minX =
          width / 2 -
          orb.baseRect.right;

        orb.maxX =
          window.innerWidth -
          width / 2 -
          orb.baseRect.left;

        orb.minY =
          height / 2 -
          orb.baseRect.bottom;

        orb.maxY =
          window.innerHeight -
          height / 2 -
          orb.baseRect.top;
      });
    };

    const animate = (time: number) => {
      const delta = Math.min(
        time - previousTime,
        32
      );

      previousTime = time;

      states.forEach((orb) => {
        /*
         * Occasionally choose a different direction,
         * but never stop moving.
         */
        if (time >= orb.nextChange) {
          orb.targetVx =
            (Math.random() - 0.5) * 0.05;

          orb.targetVy =
            (Math.random() - 0.5) * 0.04;

          orb.nextChange =
            time +
            2000 +
            Math.random() * 4000;
        }

        /*
         * Smooth steering.
         */
        orb.vx +=
          (orb.targetVx - orb.vx) * 0.02;

        orb.vy +=
          (orb.targetVy - orb.vy) * 0.02;

        orb.x += orb.vx * delta;
        orb.y += orb.vy * delta;

        /*
         * Actual viewport boundaries.
         */
        if (orb.x >= orb.maxX) {
          orb.x = orb.maxX;

          orb.targetVx =
            -Math.abs(orb.targetVx);

          orb.vx =
            -Math.abs(orb.vx);
        }

        if (orb.x <= orb.minX) {
          orb.x = orb.minX;

          orb.targetVx =
            Math.abs(orb.targetVx);

          orb.vx =
            Math.abs(orb.vx);
        }

        if (orb.y >= orb.maxY) {
          orb.y = orb.maxY;

          orb.targetVy =
            -Math.abs(orb.targetVy);

          orb.vy =
            -Math.abs(orb.vy);
        }

        if (orb.y <= orb.minY) {
          orb.y = orb.minY;

          orb.targetVy =
            Math.abs(orb.targetVy);

          orb.vy =
            Math.abs(orb.vy);
        }

        orb.el.style.transform = `
        translate3d(
          ${orb.x}px,
          ${orb.y}px,
          0
        )
        scale(${orb.scale})
      `;
      });

      animationFrame =
        requestAnimationFrame(animate);
    };

    window.addEventListener(
      "resize",
      updateBounds
    );

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        updateBounds
      );
    };
  }, []);

  function beginLearner(event: FormEvent) {
    event.preventDefault();

    const email = learnerDraft.trim();

    if (!isEmail(email)) {
      setLearnerError(
        "Enter a valid learner email address."
      );
      return;
    }

    setLearnerEmail(email);
    setLearnerError("");
    setConversationId("");

    setMessages([
      {
        id: newId(),
        role: "assistant",
        content: `What would you like to know about ${email}?`,
      },
    ]);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function changeLearner() {
    setLearnerDraft(learnerEmail);
    setLearnerEmail("");
    setConversationId("");
    setMessages([]);
    setInput("");
    setError("");
    setLearnerError("");
  }

  async function sendMessage() {
    const message = input.trim();

    if (!message || !learnerEmail || isSending) {
      return;
    }

    setError("");
    setInput("");

    setMessages((current) => [
      ...current,
      {
        id: newId(),
        role: "user",
        content: message,
      },
    ]);

    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message,
          learnerEmail,
          conversationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to send the message."
        );
      }

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((current) => [
        ...current,
        {
          id: data.messageId || newId(),
          role: "assistant",
          content: data.answer,
        },
      ]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong while contacting CheckOnIt."
      );
    } finally {
      setIsSending(false);

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void sendMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  }

  async function copyMessage(message: Message) {
    try {
      await navigator.clipboard.writeText(message.content);

      setCopiedMessageId(message.id);

      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === message.id ? null : current
        );
      }, 1600);
    } catch {
      setError("Unable to copy this response.");
    }
  }


  return (
    <main className="ambient-page">
      <div
        className="ambient-orbs"
        aria-hidden="true"
      >
        <span className="ambient-orb orb-a" />
        <span className="ambient-orb orb-b" />
        <span className="ambient-orb orb-c" />
        <span className="ambient-orb orb-d" />
      </div>

      <section
        className="glass-frame"
        aria-label="CheckOnIt chat"
      >
        <div className="glass-panel">
          <header className="minimal-header">
            <div className="brand-lockup">
              <span
                className="brand-dot"
                aria-hidden="true"
              />
              <span>CheckOnIt</span>
            </div>

            <div className="header-meta">
              {learnerEmail ? (
                <button
                  className="learner-chip"
                  type="button"
                  onClick={changeLearner}
                >
                  <span>{learnerEmail}</span>
                  <small>Change</small>
                </button>
              ) : (
                <span className="staff-label">
                  {staffLabel}
                </span>
              )}

              {!authDisabled && (
                <a
                  className="icon-link"
                  href="/signout"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  ↗
                </a>
              )}
            </div>


          </header>

          <div className="view-stage">
            <section
              className={`view-layer learner-view ${learnerEmail
                ? "is-hidden"
                : "is-active"
                }`}
              aria-hidden={Boolean(learnerEmail)}
            >
              <div className="learner-gate">
                <div className="gate-copy">
                  <p className="eyebrow-glass">
                    Learner operations assistant
                  </p>

                  <h1>
                    Who would you like to check?
                  </h1>

                  <p>
                    Enter a learner email to start the
                    conversation.
                  </p>
                </div>

                <form
                  className="learner-form"
                  onSubmit={beginLearner}
                >
                  <div className="input-glass">
                    <input
                      value={learnerDraft}
                      onChange={(event) =>
                        setLearnerDraft(
                          event.target.value
                        )
                      }
                      placeholder="learner@learning..."
                      type="email"
                      autoComplete="off"
                      autoFocus
                      aria-label="Learner email"
                    />

                    <button type="submit" aria-label="Continue">
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="button-icon"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {learnerError && (
                    <p className="inline-error">
                      {learnerError}
                    </p>
                  )}
                </form>
              </div>
            </section>

            <section
              className={`view-layer chat-view ${learnerEmail
                ? "is-active"
                : "is-hidden"
                }`}
              aria-hidden={!learnerEmail}
            >
              <div
                className="chat-scroll"
                aria-live="polite"
              >
                <div className="chat-stream">
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`chat-message ${message.role}`}
                    >
                      <div className="message-role">
                        {message.role === "assistant"
                          ? "CheckOnIt"
                          : "You"}
                      </div>

                      <div className="message-text">
                        {message.content
                          .split("\n")
                          .map((line, index, all) => (
                            <span key={`${message.id}-${index}`}>
                              {line || "\u00A0"}
                              {index < all.length - 1 && <br />}
                            </span>
                          ))}
                      </div>

                      {message.role === "assistant" && (
                        <button
                          type="button"
                          className={`copy-message-button ${copiedMessageId === message.id ? "is-copied" : ""
                            }`}
                          onClick={() => void copyMessage(message)}
                          aria-label={
                            copiedMessageId === message.id
                              ? "Copied"
                              : "Copy response"
                          }
                          title={
                            copiedMessageId === message.id
                              ? "Copied"
                              : "Copy response"
                          }
                        >
                          {copiedMessageId === message.id ? (
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className="copy-icon"
                            >
                              <path
                                d="M5 12.5l4 4L19 7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              className="copy-icon"
                            >
                              <rect
                                x="9"
                                y="9"
                                width="10"
                                height="10"
                                rx="2"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                              />

                              <path
                                d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </article>
                  ))}

                  {isSending && (
                    <article className="chat-message assistant">
                      <div className="message-role">
                        Checking On It
                      </div>

                      <div
                        className="typing-dots"
                        aria-label="CheckOnIt is thinking"
                      >
                        <span />
                        <span />
                        <span />
                      </div>
                    </article>
                  )}

                  {error && (
                    <div className="chat-error">
                      {error}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <footer className="minimal-composer-wrap">
                <div className="composer-row">
                  <form
                    className="minimal-composer"
                    onSubmit={submit}
                  >
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(event) =>
                        setInput(event.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      placeholder="Ask anything about this learner..."
                      rows={1}
                      disabled={isSending}
                    />

                    <button
                      type="submit"
                      disabled={isSending || !input.trim()}
                      aria-label="Send message"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="button-icon"
                      >
                        <path
                          d="M12 19V5M6 11l6-6 6 6"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </form>

                  <div className="topics-help">
                    <button
                      type="button"
                      className="topics-button"
                      aria-label="What can I ask?"
                      aria-expanded={showTopics}
                      onClick={() =>
                        setShowTopics((current) => !current)
                      }
                    >
                      i
                    </button>

                    {showTopics && (
                      <div className="topics-popover">
                        <p className="topics-title">
                          What can I ask?
                        </p>

                        <div className="topics-list">
                          <button
                            type="button"
                            onClick={() => {
                              setInput(
                                "Show me the learner's attendance"
                              );
                              setShowTopics(false);
                            }}
                          >
                            Attendance
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInput(
                                "Check the learner's attendance verification"
                              );
                              setShowTopics(false);
                            }}
                          >
                            Attendance verification
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInput(
                                "What is the learner's current module and upcoming sessions?"
                              );
                              setShowTopics(false);
                            }}
                          >
                            Current module & sessions
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInput(
                                "Show me the learner's module performance"
                              );
                              setShowTopics(false);
                            }}
                          >
                            Module performance
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInput(
                                "Does this learner have any outstanding payments?"
                              );
                              setShowTopics(false);
                            }}
                          >
                            Payment
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInput(
                                "Show me this learner's support tickets"
                              );
                              setShowTopics(false);
                            }}
                          >
                            Support tickets
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setInput(
                                "Give me an overview of this learner"
                              );
                              setShowTopics(false);
                            }}
                          >
                            Learner overview
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <p className="micro-note">
                  Enter to send · Shift + Enter for a new line
                </p>
              </footer>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}