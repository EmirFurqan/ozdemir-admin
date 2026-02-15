import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { fetchAPI } from "../lib/api";
import { redirect } from "next/navigation";


export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Fetch current user
    let user = null;
    let isForbidden = false;

    try {
        console.log("Fetching user from /auth/admin/me...");
        // Strict backend check: Returns 403 if not ADMIN
        user = await fetchAPI("/auth/admin/me");
        console.log("User fetched successfully:", user?.username, user?.role);
    } catch (e: any) {
        console.error("Layout Fetch Error:", e);

        // Detect 403 Forbidden
        if (typeof e.message === 'string' && e.message.includes("403")) {
            isForbidden = true;
        }

        // Silence 401/403 errors in logs
        if (typeof e.message === 'string' && !e.message.includes("401") && !e.message.includes("403")) {
            console.error("Failed to fetch user:", e);
        }
    }

    // Handle Forbidden (Logged in but wrong role)
    if (isForbidden) {
        redirect("/unauthorized");
    }

    // Handle Unauthorized (Not logged in or other error) -> Logout
    if (!user) {
        redirect("/api/auth/logout");
    }

    return (
        <div className="flex bg-slate-50 h-screen overflow-hidden font-sans text-slate-900">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
