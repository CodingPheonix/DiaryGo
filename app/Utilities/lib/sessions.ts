import 'server-only'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
// import { session } from '@/app/api/mongo/mongo_schema'
// import { connect_to_mongo } from '@/app/api/mongo/connect_to_mongo'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  userId: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}
 
export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch (error) {
    console.log('Failed to verify session')
  }
}

export const getSession = async () => {
    const cookie = (await cookies()).get('session')?.value
    if (!cookie) return null
    return await decrypt(cookie)
}


export async function createSession(userId: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)      // calculates date 7 days from now
    const session = await encrypt({ userId, expiresAt })
    const cookieStore = await cookies()

    cookieStore.set('session', session, {
        httpOnly: true,
        secure: true,
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
    })
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  const payload = session ? await decrypt(session) : null;

  if (!session || !payload) {
    return null;
  }

  // create expiry (7 days from now)
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // update cookie with new expiry
  (await cookies()).set("session", session, {
    httpOnly: true,
    secure: true,
    expires, // ✅ safe reference
    sameSite: "lax",
    path: "/",
  });

  return payload;
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
}