"use client";
import { useRouter } from "next/navigation";
import WelcomeScreen from "@/components/WelcomeScreen";
import { UserProfile } from "@/types";

export default function Home() {
  const router = useRouter();

  const handleProfileComplete = (user: UserProfile) => {
    // Store user profile in session storage
    if (typeof window !== "undefined") {
      sessionStorage.setItem("userProfile", JSON.stringify(user));
    }
    // Navigate to chat
    router.push("/chat");
  };

  return <WelcomeScreen onProfileComplete={handleProfileComplete} />;
}