import Image from "next/image";
import FirstTimeLoginForm from "@/components/FirstTimeLoginForm";

export default function FirstTimeLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="PeerVote Logo"
              width={100}
              height={100}
              priority
              className="rounded-2xl"
            />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#f5f5f5]">PeerVote</h1>
          <p className="mt-1 text-sm text-[#a1a1aa]">First-Time Login Setup</p>
          <p className="mt-1 text-xs text-[#71717a]">Set your permanent password to get started</p>
        </div>

        <div className="card-surface rounded-2xl p-6 shadow-xl">
          <div className="mb-4">
            <p className="text-xs text-[#a1a1aa]">
              Welcome! Your account has been created with a temporary password. Please set a permanent password below to access the platform.
            </p>
          </div>
          <FirstTimeLoginForm />
        </div>

        <p className="mt-5 text-center text-xs text-[#52525b]">
          This is a secure, one-time setup. Your temporary password will be replaced with your new permanent password.
        </p>
      </div>
    </main>
  );
}
