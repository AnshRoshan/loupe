import { AuthForm } from "@/components/auth-form";
export const metadata = { title: "Recover your account" };
export default function ForgotPassword() {
  return <AuthForm mode="reset" />;
}
