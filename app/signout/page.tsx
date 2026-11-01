import { signOut } from "@/auth";
import { isAuthDisabled } from "@/lib-auth-mode";
import { redirect } from "next/navigation";

export default function SignOutPage() {
  if (isAuthDisabled) {
    redirect("/chat");
  }

  return (
    <main className="login-page">
      <section className="login-card small-card">
        <div className="brand-mark" aria-hidden="true">✓</div>
        <h1>Sign out</h1>
        <p className="login-copy">End your CheckOnIt session on this device?</p>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="primary-button" type="submit">
            Sign out
          </button>
        </form>
        <a className="text-link" href="/chat">Return to chat</a>
      </section>
    </main>
  );
}
