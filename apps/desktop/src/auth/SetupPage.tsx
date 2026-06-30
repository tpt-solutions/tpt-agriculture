import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "./AuthContext.js";
import { createFarmSetup } from "./auth-service.js";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { FormField } from "@tpt/ui";

export function SetupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [farmName, setFarmName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await createFarmSetup({
        farmName,
        ownerName,
        email,
        password,
      });
      setUser(user);
      navigate("/recovery-phrase", { replace: true });
    } catch (err: any) {
      setError(err.message ?? "Setup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-2xl font-bold text-green-700">
          TPT Agriculture
        </h1>
        <p className="mb-8 text-center text-sm text-gray-500">
          Set up your farm to get started
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-800">
            Create your farm
          </h2>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <FormField label="Farm name" error={undefined}>
            <Input
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              required
              placeholder="e.g. Sunrise Pastures"
            />
          </FormField>

          <FormField label="Your name" error={undefined}>
            <Input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
              placeholder="Full name"
            />
          </FormField>

          <FormField label="Email" error={undefined}>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </FormField>

          <FormField label="Password" error={undefined}>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
          </FormField>

          <Button type="submit" disabled={loading}>
            {loading ? "Setting up…" : "Create farm"}
          </Button>
        </form>
      </div>
    </div>
  );
}
