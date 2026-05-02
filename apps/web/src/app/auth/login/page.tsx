import { LoginEmailOtp } from "@/components/login-email-otp";

export const metadata = {
  title: "Sign in — AgriConnect",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14">
      <LoginEmailOtp />
    </div>
  );
}
