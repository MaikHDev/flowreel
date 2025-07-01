"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export function SearchPosts() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const router = useRouter();

  const { data, refetch, isFetching } = api.post.searchPostMessages.useQuery(
    { query: debounced },
    { enabled: debounced.length > 0 },
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (debounced) {
      refetch().then((res) => {
        setResults(res.data ?? []);
      });
    } else {
      setResults([]);
    }
  }, [debounced]);

  return (
    <div className="mx-auto max-w-md p-4">
      <input
        type="text"
        placeholder="Search posts..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border p-2 text-black"
      />

      <ul className="mt-4 text-black">
        {isFetching && <p>Searching...</p>}
        {results.map((post) => (
          <li
            key={post.id}
            className="cursor-pointer rounded p-2 hover:bg-gray-100"
            onClick={() => router.push(`/profile/${post.userName}`)}
          >
            {post.message.slice(0, 100)}...
          </li>
        ))}
      </ul>
    </div>
  );
}
