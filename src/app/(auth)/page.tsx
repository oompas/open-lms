"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import '@/config/firebase';
import Button from "@/components/Button";
import AuthForm from '@/components/AuthForm';
import AuthButton from './AuthButton';


export default function AuthPage() {

  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPass] = useState("")

  // function called on "log in" button press
  const submitLogin = () => {
    // TODO - actually do auth
    router.push('/home');
  }

  return (
    <main className="flex h-[100vh] w-[100vw] items-center justify-center">
      <div className="flex max-w-[1000px] bg-white p-20 rounded-2xl shadow-custom">

          <div className="flex flex-col h-full w-3/5 space-y-4">
              <div className="border-2 p-6 rounded-2xl">
                <div className="text-xl font-bold mb-4">Log in with email</div>
                <AuthForm 
                  email={email}
                  setEmail={setEmail}
                  password={password}
                  setPass={setPass}
                />
                <Button text="log in" onClick={() => submitLogin()} style="mt-4 ml-auto" icon="arrow" filled/>
              </div>

              <div>or</div>

              <AuthButton text={"continue with Google"} icon="google" onClick={() => router.push('/home')}/>
              <AuthButton text={"continue with another SSO"} icon="sso" onClick={() => router.push('/home')}/>
          </div>

          <div className="flex-col h-full w-2/5 ml-10 space-y-4">
            <div className="text-2xl">Welcome to <b>OpenLMS</b></div>
            <div>OpenLMS is a generic open-source education platform. Log in with your account to get started.</div>
            <div>Created at Queen’s University in Kingston Ontario.</div>
          </div>

      </div>
    </main>
  )
}
