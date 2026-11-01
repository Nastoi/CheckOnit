import { auth } from "@/auth";
import { developmentUser, isAuthDisabled } from "@/lib-auth-mode";
import { redirect } from "next/navigation";
import ChatShell from "@/components/ChatShell";

export default async function ChatPage() {
  if (isAuthDisabled) {
    return (
      <ChatShell
        staffName={developmentUser.name}
        staffEmail={developmentUser.email}
        authDisabled
      />
    );
  }

  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <ChatShell
      staffName={session.user.name || "Staff"}
      staffEmail={session.user.staffEmail || session.user.email || ""}
      authDisabled={false}
    />
  );
}
