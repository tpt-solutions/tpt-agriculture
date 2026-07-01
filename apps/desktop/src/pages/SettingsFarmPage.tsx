// Copyright 2024 TPT Solutions Ltd. // SPDX-License-Identifier: Apache-2.0
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "@tpt/ui";
import { Button } from "@tpt/ui";
import { Input } from "@tpt/ui";
import { Select } from "@tpt/ui";
import { toast } from "sonner";
import { getDb } from "@tpt/core";
import { farms } from "@tpt/core/schema";
import { eq } from "drizzle-orm";
import { useAuth } from "../auth/AuthContext.js";
import { fetchWeather } from "../weather/weather-service.js";

const COUNTRY_PROFILES = [
  { value: "nz", label: "New Zealand" },
  { value: "au", label: "Australia" },
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "za", label: "South Africa" },
  { value: "ca", label: "Canada" },
  { value: "in", label: "India" },
  { value: "br", label: "Brazil" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
];

const WEATHER_PROVIDERS = [
  { value: "open-meteo", label: "Open-Meteo (Free)" },
  { value: "bom", label: "Bureau of Meteorology (AU)" },
  { value: "met-office", label: "Met Office (UK)" },
  { value: "noaa", label: "NOAA (US)" },
  { value: "custom", label: "Custom URL" },
];

export function SettingsFarmPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwner = user?.role === "OWNER";

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCountry, setEditCountry] = useState("nz");
  const [editLat, setEditLat] = useState("");
  const [editLon, setEditLon] = useState("");
  const [editWeatherProvider, setEditWeatherProvider] = useState("open-meteo");
  const [editCustomWeatherUrl, setEditCustomWeatherUrl] = useState("");
  const [editCustomWeatherApiKey, setEditCustomWeatherApiKey] = useState("");
  const [testConnectionStatus, setTestConnectionStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const { data: farm } = useQuery({
    queryKey: ["farm", user?.farmId],
    queryFn: async () => {
      if (!user) return null;
      const db = await getDb();
      const [row] = await db
        .select()
        .from(farms)
        .where(eq(farms.id, user.farmId))
        .limit(1);
      return row;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (farm && editing) {
      setEditName(farm.name);
      setEditCountry(farm.countryProfile ?? "nz");
      setEditLat(farm.lat != null ? String(farm.lat) : "");
      setEditLon(farm.lon != null ? String(farm.lon) : "");
      const settings = farm.settingsJson ?? {};
      setEditWeatherProvider((settings.weatherProvider as string) ?? "open-meteo");
      setEditCustomWeatherUrl((settings.customWeatherUrl as string) ?? "");
      setEditCustomWeatherApiKey((settings.customWeatherApiKey as string) ?? "");
    }
  }, [farm, editing]);

  const updateFarmMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const db = await getDb();
      const settings = {
        ...(farm?.settingsJson ?? {}),
        weatherProvider: editWeatherProvider,
        customWeatherUrl: editCustomWeatherUrl,
        customWeatherApiKey: editCustomWeatherApiKey,
      };
      await db
        .update(farms)
        .set({
          name: editName,
          countryProfile: editCountry,
          lat: editLat ? Number(editLat) : null,
          lon: editLon ? Number(editLon) : null,
          settingsJson: settings,
          updatedAt: new Date(),
        })
        .where(eq(farms.id, user.farmId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farm", user?.farmId] });
      setEditing(false);
      toast.success("Farm settings updated");
      setTestConnectionStatus("idle");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update farm settings");
    },
  });

  const countryLabel = COUNTRY_PROFILES.find((c) => c.value === farm?.countryProfile)?.label ?? farm?.countryProfile?.toUpperCase() ?? "—";

  const testWeatherConnection = async () => {
    if (!editLat || !editLon) {
      toast.error("Please enter coordinates first");
      return;
    }
    setTestConnectionStatus("testing");
    
    try {
      let success = false;
      if (editWeatherProvider === "custom") {
        // Validate custom URL format
        let customUrl = editCustomWeatherUrl.trim();
        if (!customUrl) {
          throw new Error("Please enter a custom weather URL");
        }
        // Ensure URL ends with ? for API key parameter
        if (!customUrl.includes("?")) {
          customUrl = customUrl + "?";
        }
        // Test the custom endpoint with coordinates
        const url = `${customUrl}latitude=${editLat}&longitude=${editLon}&current_weather=true&apikey=${editCustomWeatherApiKey}`;
        const response = await fetch(url);
        success = response.ok;
      } else if (editWeatherProvider === "open-meteo") {
        // Use the standard weather service for open-meteo
        const weather = await fetchWeather(Number(editLat), Number(editLon), editWeatherProvider);
        success = weather !== null;
      } else {
        // Other providers not yet fully implemented - still test connectivity
        throw new Error("This provider is not yet fully implemented");
      }
      
      if (success) {
        setTestConnectionStatus("success");
        toast.success("Weather connection successful");
      } else {
        setTestConnectionStatus("error");
        toast.error("Weather connection failed");
      }
    } catch (err) {
      setTestConnectionStatus("error");
      const msg = err instanceof Error ? err.message : "Connection failed";
      toast.error(msg);
    }
  };

  return (
    <DashboardShell title="Farm Settings">
      <div className="max-w-lg rounded-lg border border-gray-200 bg-white p-6">
        {editing && isOwner ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Only allow saving if provider tested successfully (for custom) or is known working provider
              if (editWeatherProvider === "custom" && testConnectionStatus !== "success") {
                toast.error("Please test the custom weather provider connection before saving");
                return;
              }
              if (!["open-meteo", "custom"].includes(editWeatherProvider) && testConnectionStatus !== "success") {
                toast.error("Please test the weather provider connection before saving");
                return;
              }
              updateFarmMutation.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Farm Name</label>
              <Input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Country Profile</label>
              <Select
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
                options={COUNTRY_PROFILES}
              />
              <p className="mt-1 text-xs text-gray-400">
                Sets date/number formatting and regulatory labels for your region.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={editLat}
                  onChange={(e) => setEditLat(e.target.value)}
                  placeholder="-41.0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={editLon}
                  onChange={(e) => setEditLon(e.target.value)}
                  placeholder="174.0"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Weather Provider</label>
              <Select
                value={editWeatherProvider}
                onChange={(e) => {
                  setEditWeatherProvider(e.target.value);
                  setTestConnectionStatus("idle");
                }}
                options={WEATHER_PROVIDERS}
              />
            </div>
            {editWeatherProvider === "custom" && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Custom Weather URL</label>
                  <Input
                    type="text"
                    value={editCustomWeatherUrl}
                    onChange={(e) => {
                      setEditCustomWeatherUrl(e.target.value);
                      setTestConnectionStatus("idle");
                    }}
                    placeholder="https://api.example.com/weather"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">API Key (optional)</label>
                  <Input
                    type="password"
                    value={editCustomWeatherApiKey}
                    onChange={(e) => setEditCustomWeatherApiKey(e.target.value)}
                    placeholder="API key for custom provider"
                  />
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={testWeatherConnection}
                disabled={testConnectionStatus === "testing" || !editLat || !editLon}
              >
                {testConnectionStatus === "testing" ? "Testing..." : "Test Connection"}
              </Button>
              {testConnectionStatus === "success" && (
                <span className="text-xs text-green-600">Connected!</span>
              )}
              {testConnectionStatus === "error" && (
                <span className="text-xs text-red-600">Failed</span>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Farm ID</label>
              <p className="font-mono text-xs text-gray-400">{farm?.id ?? "—"}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Created</label>
              <p className="text-sm text-gray-800">
                {farm?.createdAt ? new Date(farm.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                type="submit" 
                loading={updateFarmMutation.isPending}
                disabled={editWeatherProvider === "custom" && testConnectionStatus !== "success"}
              >
                Save Changes
              </Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500">Farm Name</label>
              <p className="mt-1 text-sm text-gray-800">{farm?.name ?? "—"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Farm ID</label>
              <p className="mt-1 font-mono text-xs text-gray-500">{farm?.id ?? "—"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Country Profile</label>
              <p className="mt-1 text-sm text-gray-800">{countryLabel}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Coordinates</label>
              <p className="mt-1 text-sm text-gray-800">
                {farm?.lat != null && farm?.lon != null
                  ? `${farm.lat.toFixed(4)}, ${farm.lon.toFixed(4)}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Created</label>
              <p className="mt-1 text-sm text-gray-800">
                {farm?.createdAt ? new Date(farm.createdAt).toLocaleDateString() : "—"}
              </p>
            </div>
            {isOwner && (
              <div className="pt-2">
                <Button onClick={() => setEditing(true)}>Edit Farm Settings</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}