// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { Select } from "@tpt/ui";
import { toast } from "sonner";
import { getDb } from "@tpt/core";
import { users, farmUsers } from "@tpt/core/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { useAuth } from "../auth/AuthContext.js";
import type { FarmRole } from "@tpt/core/schema";

const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
  { value: "READONLY", label: "Read Only" },
];

export function SettingsUsersPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.role === "OWNER";

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", password: "", role: "MEMBER" as FarmRole });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "MEMBER" as FarmRole });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const addMemberMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const db = await getDb();

      // Check if email already exists
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, addForm.email.toLowerCase()))
        .limit(1);

      if (existing) {
        // Check if already a member of this farm
        const [existingMembership] = await db
          .select()
          .from(farmUsers)
          .where(and(eq(farmUsers.userId, existing.id), eq(farmUsers.farmId, user.farmId)))
          .limit(1);

        if (existingMembership) {
          throw new Error("This user is already a member of this farm");
        }

        // Add existing user to farm
        await db.insert(farmUsers).values({
          id: crypto.randomUUID(),
          farmId: user.farmId,
          userId: existing.id,
          role: addForm.role,
        });
      } else {
        // Create new user + farm membership
        const passwordHash = await bcrypt.hash(addForm.password, 10);
        const userId = crypto.randomUUID();
        const now = new Date();

        await db.insert(users).values({
          id: userId,
          name: addForm.name,
          email: addForm.email.toLowerCase(),
          passwordHash,
          createdAt: now,
          updatedAt: now,
        });

        await db.insert(farmUsers).values({
          id: crypto.randomUUID(),
          farmId: user.farmId,
          userId,
          role: addForm.role,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-users", user?.farmId] });
      setShowAddForm(false);
      setAddForm({ name: "", email: "", password: "", role: "MEMBER" });
      toast.success("Member added successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add member");
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async () => {
      if (!user || !editingUserId) throw new Error("Not authenticated");
      const db = await getDb();

      // Update user name/email
      await db
        .update(users)
        .set({ name: editForm.name, email: editForm.email.toLowerCase(), updatedAt: new Date() })
        .where(eq(users.id, editingUserId));

      // Update role in farm_users
      await db
        .update(farmUsers)
        .set({ role: editForm.role })
        .where(and(eq(farmUsers.userId, editingUserId), eq(farmUsers.farmId, user.farmId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-users", user?.farmId] });
      setEditingUserId(null);
      toast.success("Member updated successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update member");
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!user) throw new Error("Not authenticated");
      if (userId === user.userId) throw new Error("Cannot remove yourself");
      const db = await getDb();

      // Remove farm membership
      await db
        .delete(farmUsers)
        .where(and(eq(farmUsers.userId, userId), eq(farmUsers.farmId, user.farmId)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm-users", user?.farmId] });
      setDeleteConfirmId(null);
      toast.success("Member removed from farm");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    },
  });

  function startEdit(m: typeof members[0]) {
    setEditingUserId(m.userId);
    setEditForm({ name: m.userName, email: m.userEmail, role: m.role });
  }

  return (
    <DashboardShell
      title="Users"
      actions={
        isOwner && !showAddForm ? (
          <Button onClick={() => setShowAddForm(true)}>+ Add Member</Button>
        ) : undefined
      }
    >
      {/* Add Member Form */}
      {showAddForm && isOwner && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Add Farm Member</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addMemberMutation.mutate();
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
              <Input
                type="text"
                required
                value={addForm.name}
                onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <Input
                type="email"
                required
                value={addForm.email}
                onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Password</label>
              <Input
                type="password"
                required
                value={addForm.password}
                onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Initial password"
                minLength={6}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
              <Select
                value={addForm.role}
                onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value as FarmRole }))}
                options={ROLE_OPTIONS}
              />
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" loading={addMemberMutation.isPending}>Add Member</Button>
              <Button type="button" variant="secondary" onClick={() => { setShowAddForm(false); setAddForm({ name: "", email: "", password: "", role: "MEMBER" }); }}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Member Form */}
      {editingUserId && isOwner && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 mb-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Edit Member</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMemberMutation.mutate();
            }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
              <Input
                type="text"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <Input
                type="email"
                required
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
              <Select
                value={editForm.role}
                onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value as FarmRole }))}
                options={ROLE_OPTIONS}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={updateMemberMutation.isPending}>Save Changes</Button>
              <Button type="button" variant="secondary" onClick={() => setEditingUserId(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Members Table */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-2 font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 font-medium text-gray-600">Email</th>
              <th className="px-4 py-2 font-medium text-gray-600">Role</th>
              {isOwner && <th className="px-4 py-2 text-right font-medium text-gray-600">Actions</th>}
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
                          : m.role === "MEMBER"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {m.role}
                  </span>
                </td>
                {isOwner && (
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {m.role !== "OWNER" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => startEdit(m)}>
                            Edit
                          </Button>
                          {deleteConfirmId === m.userId ? (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-red-600">Remove?</span>
                              <Button variant="danger" size="sm" onClick={() => removeMemberMutation.mutate(m.userId)}>
                                Yes
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                                No
                              </Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(m.userId)}>
                              Remove
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={isOwner ? 4 : 3} className="px-4 py-4 text-center text-gray-500">
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
