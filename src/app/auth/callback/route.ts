import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/sandbox'
  const error_description = searchParams.get('error_description')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    
    console.error("Supabase exchange error:", error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  if (error_description) {
    console.error("Supabase callback error:", error_description)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description)}`)
  }

  // Fallback for missing code/error
  return NextResponse.redirect(`${origin}/login?error=OAuth%20flow%20interrupted`)
}
