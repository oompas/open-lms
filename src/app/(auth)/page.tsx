import Image from 'next/image'
import Button from "@/components/Button";
import '@/config/firebase';

export default function AuthPage() {
  return (
    <main className="flex h-[100vh] w-[100vw] items-center justify-center">
      <div className="flex max-w-[1000px] bg-white p-20 rounded-2xl">
          <div className="flex flex-col h-full w-3/5 space-y-4">
              <div className="border-2 p-6">login form</div>
              <div>or</div>
              <Button text={"continue with Google"} link="/home"/>
              <Button text={"continue with another SSO"} link="/home"/>
          </div>
          <div className="flex-col h-full w-2/5 ml-10 space-y-4">
            <div>Welcome to OpenLMS</div>
            <div>OpenLMS is a generic open-source education platform. Log in with your account to get started.</div>
            <div>Created at Queen’s University in Kingston Ontario.</div>
          </div>
      </div>
    </main>
  )
}
