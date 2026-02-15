import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    // Delete the token cookie
    (await cookies()).delete("token");

    // Redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
}
