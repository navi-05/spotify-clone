'use client'

import { useSupabaseClient, useSessionContext } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect } from 'react'

import Modal from "./Modal"
import { Auth } from '@supabase/auth-ui-react'
import useAuthModal from '@/hooks/useAuthModal'

const AuthModal = () => {

  const supabaseClient = useSupabaseClient()
  const router = useRouter()
  const { session } = useSessionContext()
  const { onClose, isOpen } = useAuthModal();

  useEffect(() => {
    if(session) {
      router.refresh()
      onClose()
    }
  }, [session, router, onClose])

  const onChange = (open: boolean) => {
    if(!open) onClose()
  }

  return (
    <Modal
      title="Spotify-Clone"
      description="Connect with us and listen to your favorite music!"
      isOpen={isOpen}
      onChange={onChange}
    >
      <Auth 
        supabaseClient={supabaseClient}
        appearance={
          { 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#404040',
                  brandAccent: '#22c55e'
                }
              }
            }
          }
        }
        providers={['google', 'github']}
        theme='dark'
      />
    </Modal>
  )
}

export default AuthModal