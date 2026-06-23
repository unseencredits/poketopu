import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const redirectTo = searchParams.get('redirect_to') ?? '/email-onay'

  // Supabase geçersiz/süresi dolmuş token durumunda ?error= ile döner
  if (error) {
    return NextResponse.redirect(new URL('/link-gecersiz', origin))
  }

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options) } catch {}
            })
          },
        },
      }
    )
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(new URL('/link-gecersiz', origin))
    }
  } else {
    // Ne code ne error var — beklenmedik durum
    return NextResponse.redirect(new URL('/link-gecersiz', origin))
  }

  return NextResponse.redirect(new URL(redirectTo, origin))
}
