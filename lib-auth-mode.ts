export const authMode =
  (process.env.AUTH_MODE || "entra").trim().toLowerCase() === "disabled"
    ? "disabled"
    : "entra";

export const isAuthDisabled = authMode === "disabled";

export const developmentUser = {
  staffId: process.env.DEV_STAFF_ID || "local-dev-staff",
  name: process.env.DEV_STAFF_NAME || "Local Developer",
  email: process.env.DEV_STAFF_EMAIL || "local@checkonit.dev",
};
