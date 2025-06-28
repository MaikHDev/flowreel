"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { redirect } from "next/navigation";
import Comment from "~/app/_components/comment";

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
      redirect("/api/auth/singin");
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

  useEffect(() => {
    console.log(latestPosts);
  }, []);

  return (
    <div className="flex flex-col items-center p-4">
      {session?.user?.name == userName && (
        <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-lg">
          <div className="mb-4 flex items-center">
            <img
              src={session?.user?.image ?? "/default-avatar.png"}
              alt="Profile"
              className="mr-3 h-12 w-12 rounded-full"
            />
            <div className="text-xl font-bold">
              {session?.user?.name ?? "Guest User"}
            </div>
          </div>
          <textarea
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full rounded-lg border p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            rows={4}
          />
          <button
            onClick={handlePostSubmit}
            disabled={isLoading ?? !postContent.trim()}
            className={`mt-4 w-full rounded-lg p-2 text-white ${
              isLoading || !postContent.trim()
                ? "cursor-not-allowed bg-gray-400"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isLoading ? "Posting..." : "Post"}
          </button>
        </div>
      )}
      <div className="mt-6 w-full max-w-lg">
        <h2 className="mb-4 text-2xl font-bold">Latest Posts</h2>
        {loadingPosts && "Getting posts..."}
        {latestPosts?.map((post) => (
          <div key={post.id} className="mb-4 rounded-lg bg-gray-100 p-4 shadow">
            <div className="mb-2 flex items-center">
              <span className="mr-2 font-bold">{post.user.name}</span>
              <span className="text-sm text-gray-500">{`${post.createdAt.getDate()}/${post.createdAt.getMonth()}  ${post.createdAt.getHours()}:${post.createdAt.getMinutes() < 10 ? `0${post.createdAt.getMinutes()}` : post.createdAt.getMinutes()}`}</span>
            </div>
            <p className="text-gray-800">{post.message}</p>
            <button
              onClick={() => handleLike(post.id)}
              className={`mt-2 rounded-lg px-4 py-2 text-white ${
                post.likedByCurrentUser ? "bg-pink-600" : "bg-gray-400"
              } hover:bg-pink-700`}
            >
              💗 {post.likedByCurrentUser ? "Liked" : "Like"} ({post.likeCount})
            </button>
            <span>Comments: {post.commentCount}</span>
            {session?.user && (
              <span>
                <Comment
                  userId={session.user.id}
                  postId={post.id}
                  text={"comment"}
                  level={0}
                  parentId={null}
                ></Comment>
              </span>
            )}
            {post.comments.map((comment) => {
              return (
                <div key={comment.id}>
                  {comment.user.image && (
                    <span>
                      <img
                        src={comment.user.image}
                        alt={comment.user.name}
                        width={30}
                        height={30}
                      />
                    </span>
                  )}
                  <span>{comment.user.name}</span>
                  <p>{comment.content}</p>
                  <p>{comment.createdAt.toDateString()}</p>
                  {session?.user && (
                    <Comment
                      userId={session.user.id}
                      postId={post.id}
                      text={"reply"}
                      level={1}
                      parentId={comment.id}
                    ></Comment>
                  )}
                  {comment.replies.map((reply) => {
                    return (
                      <div key={reply.id}>
                        {reply.user.image && (
                          <span>
                            <img
                              src={reply.user.image}
                              alt={reply.user.name}
                              width={30}
                              height={30}
                            />
                          </span>
                        )}
                        <span>{reply.user.name}</span>
                        <p>{reply.content}</p>
                        <p>{reply.createdAt.toDateString()}</p>
                        {session?.user && (
                          <Comment
                            userId={session.user.id}
                            postId={post.id}
                            text={"reply"}
                            level={1}
                            parentId={reply.id}
                          ></Comment>
                        )}
                        {reply.replies.map((reply_2) => {
                          return (
                            <div key={reply_2.id}>
                              {reply_2.user.image && (
                                <span>
                                  <img
                                    src={reply_2.user.image}
                                    alt={reply_2.user.name}
                                    width={30}
                                    height={30}
                                  />
                                </span>
                              )}
                              <span>{reply_2.user.name}</span>
                              <p>{reply_2.content}</p>
                              <p>{reply_2.createdAt.toDateString()}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PostPage;
