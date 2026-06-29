import { Suspense } from 'react'
import { AmbientBackground } from '@/components/ui/AmbientBackground'
import { OtpLoginForm } from '@/components/customer/OtpLoginForm'

export default function LoginPage() {
  return (
    <>
      <AmbientBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <Suspense>
          <OtpLoginForm />
        </Suspense>
      </div>
    </>
  )
}
