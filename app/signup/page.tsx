import { SignupPage } from "@/src/auth/signup/SignupPage";
import { Metadata } from "next";
import { createClient } from '@/src/utils/supabase/server';
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Sign Up - Lifeline-AI",
    description: "Create a new account on Lifeline-AI.",
};

export default async function Page() {
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

    return <SignupPage />;
}
