import { logout } from '@/app/login/actions'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="text-red-400 hover:text-red-300 transition-colors cursor-pointer text-xs font-bold tracking-widest">
        [ LOGOUT ]
      </button>
    </form>
  )
}
