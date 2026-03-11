import { auth } from "../../../../auth";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
    const session = await auth();
    const isAdmin = ['ADMIN', 'HR_ADMIN', 'HR_MANAGER'].includes(session?.user?.role || '');
    if (!session || !isAdmin) redirect("/dashboard");

    return <AnalyticsDashboard />;
}

// Client component for interactivity
import AnalyticsDashboard from "./AnalyticsDashboard";
