import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";

const tenantId = process.env.MICROSOFT_ENTRA_TENANT_ID;
const clientId = process.env.MICROSOFT_ENTRA_CLIENT_ID;
const clientSecret = process.env.MICROSOFT_ENTRA_CLIENT_SECRET;

if (!tenantId || !clientId || !clientSecret) {
  console.warn(
    "Microsoft Entra environment variables are incomplete. Sign-in will not work until they are configured."
  );
}

const microsoftEntra: Provider = {
  id: "microsoft-entra-id",
  name: "Microsoft",
  type: "oidc",
  issuer: `https://login.microsoftonline.com/${tenantId || "common"}/v2.0`,
  clientId: clientId || "missing-client-id",
  clientSecret: clientSecret || "missing-client-secret",
  authorization: {
    params: {
      scope: "openid profile email",
    },
  },
  profile(profile) {
    const claims = profile as Record<string, unknown>;
    const id = String(claims.oid || claims.sub || "");
    const email = String(
      claims.preferred_username || claims.email || claims.upn || ""
    );

    return {
      id,
      name: typeof claims.name === "string" ? claims.name : email,
      email,
      image: null,
    };
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [microsoftEntra],
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN
        ?.trim()
        .toLowerCase();

      if (!allowedDomain) return true;

      const email = user.email?.toLowerCase() || "";
      return email.endsWith(`@${allowedDomain}`);
    },

    async jwt({ token, profile }) {
      if (profile) {
        const claims = profile as Record<string, unknown>;
        token.staffId = String(claims.oid || claims.sub || token.sub || "");
        token.staffEmail = String(
          claims.preferred_username || claims.email || claims.upn || token.email || ""
        );
      }

      return token;
    },

    async session({ session, token }) {
      session.user.staffId = token.staffId;
      session.user.staffEmail = token.staffEmail || session.user.email || undefined;
      return session;
    },
  },
});
