"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export function SearchUsers() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const unfollowMutation = api.user.unfollowUser.useMutation();

  const { data, refetch, isFetching, error } = api.user.searchUsers.useQuery(
  { query: debouncedQuery },
  {
    enabled: debouncedQuery.length > 0,
  }
);

if (data) {
  console.log("Search users query successful:", data);
}

if (error) {
  console.error("Search users query error:", error);
}

  const followMutation = api.user.followUser.useMutation();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
  console.log(`Refetching search results for query: ${debouncedQuery}`);
  if (debouncedQuery.length > 0) {
    refetch().then((res) => {
      setResults(res.data ?? []);
    });
  } else {
    setResults([]);
  }
}, [debouncedQuery]);

function toggleFollow(id: string, currentlyFollowing: boolean) {
  setResults((prev) =>
    prev.map((user) =>
      user.id === id ? { ...user, followed: !currentlyFollowing } : user
    )
  );

  const mutation = currentlyFollowing ? unfollowMutation : followMutation;

  mutation.mutate({ userId: id }, {
    onError: () => {
      setResults((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, followed: currentlyFollowing } : user
        )
      );
    },
  });
}


  return (
    <div className="max-w-md mx-auto p-4">
      <input
        type="text"
        placeholder="Search for users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full p-2 border rounded text-black"
      />

      <ul className="mt-4">
        {isFetching && <p>Searching...</p>}
        {results.map((user) => (
          <li key={user.id} className="flex justify-between py-2 border-b">
            <span>{user.name} ({user.email})</span>
            <button
              onClick={() => toggleFollow(user.id, user.followed)}
              className={`px-3 py-1 rounded text-white ${
                user.followed ? "bg-green-500" : "bg-blue-500"
              }`}
            >
              {user.followed ? "Following" : "Follow"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
