"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: profileData, isLoading } =
    api.profile.getCurrentProfile.useQuery(undefined, {
      enabled: !!session,
    });

  const updateVisibility = api.profile.updatePostVisibility.useMutation({
    onSuccess: () => {
      utils.profile.getCurrentProfile.invalidate();
    },
  });

  const [visibility, setVisibility] = useState<
    "public" | "followers" | "private"
  >("public");

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVis = e.target.value as "public" | "followers" | "private";
    if (!newVis) return;
    updateVisibility.mutate({ visibility: newVis });
  };

  if (!session) return <p>Please sign in to update your settings.</p>;
  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Privacy Settings</h1>
      <label className="mb-2 block text-sm font-medium">
        Who can see your posts?
      </label>
      <select
        value={profileData?.defaultPostVisibility!}
        onChange={handleChange}
        className="w-full rounded border p-2"
      >
        <option value="public">Everyone</option>
        <option value="followers">Followers Only</option>
        <option value="private">Only Me</option>
      </select>
    </div>
  );
}
