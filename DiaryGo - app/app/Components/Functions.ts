"server-only"

import { cookies } from "next/headers"
import { decrypt } from "../Utilities/lib/sessions"

export async function get_session() {
    const cookie = (await cookies()).get('session')?.value
    const session = await decrypt(cookie)
    console.log(session)
}