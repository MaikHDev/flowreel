"use client";

import { useState, useEffect } from "react";
import { api } from "~/trpc/react";

export function SearchUsers() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const requestFollow = api.user.requestFollow.useMutation();
  const acceptFollow = api.user.acceptFollow.useMutation();
  const removeFollow = api.user.removeFollow.useMutation();

  const { data, refetch, isFetching } = api.user.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 }
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length > 0) {
      refetch().then((res) => {
        setResults(res.data ?? []);
      });
    } else {
      setResults([]);
    }
  }, [debouncedQuery]);

  function updateStatus(id: string, data: Partial<any>) {
    setResults((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...data } : user))
    );
  }

  function handleFollow(user: any) {
    requestFollow.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          updateStatus(user.id, { youFollowThem: true, requestedThem: true });
        },
      }
    );
  }

  function handleUnfollow(user: any) {
    removeFollow.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          updateStatus(user.id, {
            youFollowThem: false,
            requestedThem: false,
            mutualFollow: false,
          });
        },
      }
    );
  }

  function handleAccept(user: any) {
  acceptFollow.mutate(
    { followerId: user.id },
    {
      onSuccess: () => {
        updateStatus(user.id, {
          theyFollowYou: true,
          mutualFollow: user.youFollowThem,
        });
      },
    }
  );
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

      <ul className="mt-4 text-black">
        {isFetching && <p>Searching...</p>}
        {results.map((user) => (
          <li key={user.id} className="flex flex-col gap-2 py-2 border-b">
            <div className="flex justify-between items-center text-black">
              <span>
                {user.name} ({user.email})
              </span>
              <div className="flex gap-2">
                {user.mutualFollow ? (
                  <button
                    onClick={() => handleUnfollow(user)}
                    className="px-3 py-1 rounded text-white bg-green-600"
                  >
                    Friends
                  </button>
                ) : user.youFollowThem ? (
                  <button
                    onClick={() => handleUnfollow(user)}
                    className="px-3 py-1 rounded text-white bg-blue-500"
                  >
                    Following
                  </button>
                ) : user.requestedThem ? (
                  <button
                    onClick={() => handleUnfollow(user)}
                    className="px-3 py-1 rounded text-white bg-yellow-500"
                  >
                    Requested
                  </button>
                ) : (
                  <button
                    onClick={() => handleFollow(user)}
                    className="px-3 py-1 rounded text-white bg-blue-500"
                  >
                    Follow
                  </button>
                )}
              </div>
            </div>

            {user.requestedMe && !user.theyFollowYou && (
              <div className="text-right">
                <button
                  onClick={() => handleAccept(user)}
                  className="px-2 py-1 text-sm rounded bg-green-600 text-white"
                >
                  Accept Request
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
