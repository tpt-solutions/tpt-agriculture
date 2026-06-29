import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { getDb } from "@tpt/core";
import { users, farmUsers } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useAuth } from "../auth/AuthContext.js";

export function SettingsUsersPage() {
  const { user } = useAuth();

  const { data: members = [] } = useQuery({
    queryKey: ["farm-users", user?.farmId],
    queryFn: async () => {
      if (!user) return [];
      const db = await getDb();
      const rows = await db
        .select({
          userId: farmUsers.userId,
          role: farmUsers.role,
          userName: users.name,
          userEmail: users.email,
        })
        .from(farmUsers)
        .innerJoin(users, eq(farmUsers.userId, users.id))
        .where(eq(farmUsers.farmId, user.farmId));
      return rows;
    },
    enabled: !!user,
  });

  return (
    <DashboardShell title="Users">
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 font-medium text-gray-600">Email</th>
              <th className="px-4 py-2 font-medium text-gray-600">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.userId} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 text-gray-800">{m.userName}</td>
                <td className="px-4 py-2 text-gray-600">{m.userEmail}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      m.role === "OWNER"
                        ? "bg-green-100 text-green-700"
                        : m.role === "ADMIN"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {m.role}
                  </span>
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
