import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from './app/Utilities/lib/sessions'

const protectedRoutes = ['/Calendar', '/My_dairy', '/Finished_task', '/Contact']
const publicRoutes = ['/'] // homepage has login/signup components

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname
    const isProtectedRoute = protectedRoutes.includes(path)
    const isPublicRoute = publicRoutes.includes(path)

    const cookie = (await cookies()).get('session')?.value
    const session = await decrypt(cookie)
    console.log(session)

    // if (session?.userId) {
    //     return NextResponse.redirect(new URL('/My_dairy', req.nextUrl))
    // }

    if (isProtectedRoute) {
        if (!session?.userId) {         // if the user is not signed in, he will be redirected to the homepage
            return NextResponse.redirect(new URL('/', req.nextUrl))
        }
    }
    if (isPublicRoute && session?.userId) { // if the user is signed in and is on the homepage, he will
        return NextResponse.redirect(new URL('/My_dairy', req.nextUrl))
    }
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}