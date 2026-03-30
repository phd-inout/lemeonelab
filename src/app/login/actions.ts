'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

import { headers } from 'next/headers'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("Login failed:", error.message)
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/sandbox', 'layout')
  redirect('/sandbox')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.error("Signup failed:", error.message)
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/sandbox', 'layout')
  redirect('/sandbox')
}

export async function signInWithProvider(provider: 'google' | 'github') {
  const supabase = await createClient()
  
  const headersList = await headers()
  const protocol = headersList.get('x-forwarded-proto') || 'http'
  const host = headersList.get('x-forwarded-host') || headersList.get('host')
  const origin = `${protocol}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error || !data?.url) {
    console.error("OAuth init failed:", error?.message)
    redirect('/login?error=' + encodeURIComponent(error?.message || 'OAuth init failed'))
  }

  redirect(data.url)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
