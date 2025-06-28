import { api } from "~/trpc/react";
import { useState } from "react";

interface CommentProps{
  level: 0 | 1 | 2,
  text: "comment" | "reply",
  postId: number,
  parentId: number | null,
  userId: string,
}

export default function Comment({level, text, postId, parentId, userId}: CommentProps){
  const utils = api.useUtils();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const comment = api.post.comment.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setContent("");
    },
  });

  const handleCommentSubmit = async () => {
    if (!content.trim() || !userId) return;
    setIsLoading(true);

    try {
      await comment.mutateAsync({
        userId: userId,
        postId: postId,
        parentId: parentId,
        content: content,
      });
    } catch (err) {
      console.error("Error posting:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <input type="text" onChange={(e) => setContent(e.target.value)} />
      <button onClick={handleCommentSubmit} disabled={isLoading}>{isLoading ? "sending.." : text}</button>
    </>
  )
}

