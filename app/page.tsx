import { auth, signIn } from "@/auth";
import { isAuthDisabled } from "@/lib-auth-mode";
import { redirect } from "next/navigation";

export default async function HomePage() {
  if (isAuthDisabled) {
    redirect("/chat");
  }

  const session = await auth();

  if (session?.user) {
    redirect("/chat");
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="brand-mark" aria-hidden="true">✓</div>
        <p className="eyebrow">Learner Operations</p>
        <h1>CheckOnIt</h1>
        <p className="login-copy">
          Your internal assistant for learner attendance, modules, payments,
          verification checks and support tickets.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/chat" });
          }}
        >
          <button className="microsoft-button" type="submit">
            <span className="microsoft-logo" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            Sign in with Microsoft
          </button>
        </form>

        <p className="login-note">
          Use your company Microsoft account. Access is controlled by your
          Microsoft Entra application registration.
        </p>
      </section>
    </main>
  );
}
