"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { redirect } from "next/navigation";
import Comment from "~/app/_components/comment";
import type { Session } from "next-auth";

export type Comment = {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date | null;
  user: {
    // id?: string;
    name: string;
    image: string | null;
  };
  replies?: {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date | null;
    user: {
      name: string;
      image: string | null;
    };
    replies?: {
      id: number;
      content: string;
      createdAt: Date;
      updatedAt: Date | null;
      user: {
        name: string;
        image: string | null;
      };
    }[];
  }[];
};

interface CommentProps {
  level: 0 | 1 | 2;
  session: Session | null;
  postId: number;
  comment: Comment;
}

const CommentItem = ({ comment, level = 0, session, postId }: CommentProps) => {
  const maxLevel = 2; // Limit nesting depth
  const indentClass = `ml-${Math.min(level * 4, 12)}`; // Max indent of ml-12

  return (
    <div
      className={`${level > 0 ? indentClass : ""} ${level > 0 ? "border-l-2 border-gray-200 pl-4" : ""}`}
    >
      <div className="mb-3 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center">
          {comment.user.image && (
            <img
              src={comment.user.image }
              alt={comment.user.name}
              className="mr-2 h-8 w-8 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {comment.user.name}
            </span>
            <span className="text-xs text-gray-500">
              {comment.createdAt.toLocaleDateString()} at{" "}
              {comment.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <p className="mb-2 text-sm leading-relaxed text-gray-700">
          {comment.content}
        </p>

        {session?.user && level < maxLevel && (
          <Comment
            userId={session.user.id}
            postId={postId}
            text="Reply"
            level={(level + 1) as 0 | 1 | 2}
            parentId={comment.id}
          />
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              level={(level + 1) as 0 | 1 | 2}
              session={session}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const PostPage = ({ userName }: { userName: string }) => {
  const { data: session } = useSession();
  const { data: latestPosts, isLoading: loadingPosts } =
    api.post.getLatest.useQuery(
      { userName: userName, currentUser: session?.user?.id ?? null },
      {
        enabled: !!session?.user, // Only run query if user is logged in
      },
    );
  const utils = api.useUtils();
  const [postContent, setPostContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setPostContent("");
    },
  });

  const likePost = api.post.likePost.useMutation({
    onMutate: async ({ postId }) => {
      // Cancel any outgoing refetches
      await utils.post.getLatest.cancel({
        userName: userName,
        currentUser: session?.user?.id ?? null,
      });

      // Snapshot the previous value
      const previousPosts = utils.post.getLatest.getData({
        userName: userName,
        currentUser: session?.user?.id ?? null,
      });

      // Optimistically update the cache
      utils.post.getLatest.setData(
        { userName: userName, currentUser: session?.user?.id ?? null },
        (old) => {
          if (!old) return old;
          return old.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  likedByCurrentUser: !post.likedByCurrentUser,
                  likeCount: post.likedByCurrentUser
                    ? post.likeCount - 1
                    : post.likeCount + 1,
                }
              : post,
          );
        },
      );

      return { previousPosts };
    },
  });

  const handlePostSubmit = async () => {
    if (!postContent.trim() || !session) return;
    setIsLoading(true);

    try {
      await createPost.mutateAsync({
        userId: session.user.id,
        message: postContent,
      });
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (!session) {
      redirect("/api/auth/signin");
    }
    try {
      await likePost.mutateAsync({
        postId,
        userId: session.user.id,
      });
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-4">
      {session?.user?.name === userName && (
        <div className="mb-6 w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center">
            <img
              src={session?.user?.image ?? "/default-avatar.png"}
              alt="Profile"
              className="mr-3 h-12 w-12 rounded-full border-2 border-gray-200"
            />
            <div className="text-xl font-bold text-gray-800">
              {session?.user?.name ?? "Guest User"}
            </div>
          </div>
          <textarea
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full resize-none rounded-lg border border-gray-200 p-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            rows={4}
          />
          <button
            onClick={handlePostSubmit}
            disabled={isLoading || !postContent.trim()}
            className={`mt-4 w-full rounded-lg p-3 font-medium text-white transition-colors ${
              isLoading || !postContent.trim()
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
            }`}
          >
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>
      )}

      <div className="w-full max-w-2xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Latest Posts</h2>

        {loadingPosts && (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Getting posts...</div>
          </div>
        )}

        {latestPosts?.map((post) => (
          <div
            key={post.id}
            className="mb-6 rounded-xl border border-gray-100 bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center">
              <img
                src={post.user.image ?? "/default-avatar.png"}
                alt={post.user.name}
                className="mr-3 h-10 w-10 rounded-full border-2 border-gray-200"
              />
              <div className="flex flex-col">
                <span className="font-bold text-gray-800">
                  {post.user.name}
                </span>
                <span className="text-sm text-gray-500">
                  {`${post.createdAt.getDate()}/${post.createdAt.getMonth() + 1} at ${post.createdAt.getHours()}:${post.createdAt.getMinutes() < 10 ? `0${post.createdAt.getMinutes()}` : post.createdAt.getMinutes()}`}
                </span>
              </div>
            </div>
            <p className="mb-4 leading-relaxed text-gray-800">{post.message}</p>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center space-x-2 rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                  post.likedByCurrentUser
                    ? "bg-pink-600 hover:bg-pink-700"
                    : "bg-gray-400 hover:bg-gray-500"
                }`}
              >
                <span>💗</span>
                <span>{post.likedByCurrentUser ? "Liked" : "Like"}</span>
                <span>({post.likeCount})</span>
              </button>

              <div className="flex items-center text-sm text-gray-500">
                <span>💬 {post.commentCount} comments</span>
              </div>
            </div>

            {session?.user && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <Comment
                  userId={session.user.id}
                  postId={post.id}
                  text="Add a comment"
                  level={0}
                  parentId={null}
                />
              </div>
            )}

            {post.comments && post.comments.length > 0 && (
              <div className="mt-6 border-t border-gray-100 pt-4">
                <h3 className="mb-4 font-semibold text-gray-800">Comments</h3>
                <div className="space-y-3">
                  {post.comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      level={0}
                      session={session}
                      postId={post.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostPage;
