import { redirect } from "next/navigation"

// The dedicated login page was retired — the unified AuthCard on the
// landing page now handles both sign-in and sign-up in one place.
export default function Login() {
  redirect("/")
}
