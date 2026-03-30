import { login, signup, signInWithProvider } from './actions'

export default async function LoginPage(props: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const error = searchParams?.error as string | undefined;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center scanlines font-display p-4">
      <div className="w-full max-w-md border border-border-dark bg-[#0a0f14] shadow-2xl relative overflow-hidden">
        {/* Decorative header */}
        <div className="h-1 bg-primary/80 absolute top-0 left-0 w-full shadow-[0_0_10px_rgba(0,255,136,0.5)]"></div>
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <span className="material-symbols-outlined text-[120px] text-white">fingerprint</span>
        </div>

        <div className="p-8 relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white tracking-widest flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-4xl">terminal</span>
              CORTEX<span className="text-gray-600">_OS</span>
            </h1>
            <p className="text-gray-500 mt-2 font-mono text-sm leading-relaxed">
              [ AUTHENTICATION REQUIRED ]<br/>
              ENTER SYSTEM CREDENTIALS TO ACCESS LAB ENVIRONMENT
            </p>
            {error && (
              <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-xs">
                [!] AUTH_FAILURE: {error}
              </div>
            )}
          </div>

          {/* Email / Password Login */}
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest" htmlFor="email">
                &gt; Identity_Token (Email)
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full bg-black border border-border-dark text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="founder@cyberspace.net"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-400 mb-2 uppercase tracking-widest" htmlFor="password">
                &gt; Security_Key (Password)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full bg-black border border-border-dark text-white px-4 py-3 font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2 flex gap-4">
              <button
                formAction={login}
                className="flex-1 bg-transparent border border-primary text-primary font-bold py-3 uppercase tracking-widest hover:bg-primary hover:text-black transition-colors"
              >
                [ LOGIN ]
              </button>
              <button
                formAction={signup}
                className="flex-1 bg-transparent border border-border-dark text-gray-400 font-bold py-3 uppercase tracking-widest hover:border-gray-300 hover:text-white transition-colors"
              >
                [ REGISTER ]
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border-dark"></div>
            <span className="text-xs text-gray-600 font-mono tracking-widest">OR</span>
            <div className="flex-1 h-px bg-border-dark"></div>
          </div>

          {/* OAuth Providers */}
          <div className="space-y-3">
            <form>
              <button
                formAction={async () => {
                  'use server';
                  await signInWithProvider('google')
                }}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3 uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                [ SIGN IN WITH GOOGLE ]
              </button>
            </form>
            <form>
              <button
                formAction={async () => {
                  'use server';
                  await signInWithProvider('github')
                }}
                className="w-full flex items-center justify-center gap-3 bg-[#24292e] text-white font-bold py-3 uppercase tracking-widest hover:bg-[#2f363d] transition-colors border border-gray-700"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                [ SIGN IN WITH GITHUB ]
              </button>
            </form>
          </div>

          <div className="mt-8 text-center border-t border-border-dark pt-6">
            <p className="text-xs text-gray-600 font-mono">
              SECURE CONNECTION IDENTIFIED.<br/>
              UNAUTHORIZED ACCESS IS STRICTLY MONITORED.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
