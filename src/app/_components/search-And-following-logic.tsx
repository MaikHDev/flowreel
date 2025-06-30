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
  const blockUser = api.user.blockUser.useMutation();
  const unblockUser = api.user.unblockUser.useMutation();

  const { data, refetch, isFetching } = api.user.searchUsers.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length > 0 },
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
      prev.map((user) => (user.id === id ? { ...user, ...data } : user)),
    );
  }

  function handleFollow(user: any) {
    requestFollow.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          updateStatus(user.id, { youFollowThem: true, requestedThem: true });
        },
      },
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
      },
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
      },
    );
  }

  function handleBlock(user: any) {
    blockUser.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          updateStatus(user.id, { youBlocked: true });
        },
      },
    );
  }

  function handleUnblock(user: any) {
    unblockUser.mutate(
      { userId: user.id },
      {
        onSuccess: () => {
          updateStatus(user.id, { youBlocked: false });
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <input
        type="text"
        placeholder="Search for users"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border p-2 text-black"
      />

      <ul className="mt-4 text-black">
        {isFetching && <p>Searching...</p>}
        {results.map((user) => (
          <li key={user.id} className="flex flex-col gap-2 border-b py-2">
            <div className="flex items-center justify-between">
              <span>
                {user.name} ({user.email})
              </span>

              <div className="flex gap-2">
                {user.youBlocked ? (
                  <button
                    onClick={() => handleUnblock(user)}
                    className="rounded bg-red-400 px-3 py-1 text-white"
                  >
                    Unblock
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleBlock(user)}
                      className="rounded bg-red-600 px-3 py-1 text-white"
                    >
                      Block
                    </button>

                    {user.mutualFollow ? (
                      <button
                        onClick={() => handleUnfollow(user)}
                        className="rounded bg-green-600 px-3 py-1 text-white"
                      >
                        Friends
                      </button>
                    ) : user.youFollowThem ? (
                      <button
                        onClick={() => handleUnfollow(user)}
                        className="rounded bg-blue-500 px-3 py-1 text-white"
                      >
                        Following
                      </button>
                    ) : user.requestedThem ? (
                      <button
                        onClick={() => handleUnfollow(user)}
                        className="rounded bg-yellow-500 px-3 py-1 text-white"
                      >
                        Requested
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(user)}
                        className="rounded bg-blue-500 px-3 py-1 text-white"
                      >
                        Follow
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {!user.youBlocked && user.requestedMe && !user.theyFollowYou && (
              <div className="text-right">
                <button
                  onClick={() => handleAccept(user)}
                  className="rounded bg-green-600 px-2 py-1 text-sm text-white"
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
