"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const utils = api.useUtils();

  const { data: profileData, isLoading } = api.profile.getCurrentProfile.useQuery(undefined, {
    enabled: !!session,
  });

  const updateVisibility = api.profile.updatePostVisibility.useMutation({
    onSuccess: () => {
      utils.profile.getCurrentProfile.invalidate();
      alert("Visibility updated!");
    },
  });

  const [visibility, setVisibility] = useState<"public" | "followers" | "private">("public");

//   useEffect(() => {
//     if (profileData?.defaultPostVisibility) {
//       setVisibility(profileData.defaultPostVisibility);
//     }
//   }, [profileData]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVis = e.target.value as "public" | "followers" | "private";
    // setVisibility(newVis);
    if (!newVis) return;
    updateVisibility.mutate({ visibility: newVis });
  };

  if (!session) return <p>Please sign in to update your settings.</p>;
  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Privacy Settings</h1>
      <label className="block text-sm font-medium mb-2">Who can see your posts?</label>
      <select
        value={profileData?.defaultPostVisibility!}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      >
        <option value="public">Everyone</option>
        <option value="followers">Followers Only</option>
        <option value="private">Only Me</option>
      </select>
    </div>
  );
}
