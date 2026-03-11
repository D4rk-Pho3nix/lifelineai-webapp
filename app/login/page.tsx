import { LoginPage } from "@/src/auth/login/LoginPage";
import { Metadata } from "next";
import { createClient } from '@/src/utils/supabase/server';
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Login - Lifeline-AI",
  description: "Sign in to Lifeline-AI securely.",
};

export default async function Page() {
  // Check if session exists to prevent logged-in users from seeing the login page
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (data?.user) {
    const role = data.user.user_metadata?.role || 'user';
    if (role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/');
    }
  }

  return <LoginPage />;
}
