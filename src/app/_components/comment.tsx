import { api } from "~/trpc/react";
import { useState } from "react";

interface CommentProps{
  level: 0 | 1 | 2,
  text: string,
  postId: number,
  parentId: number | null,
  userId: string,
}

export default function Comment({level, text, postId, parentId, userId}: CommentProps){
  const utils = api.useUtils();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const comment = api.post.comment.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      setContent("");
      setShowInput(false);
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

  const handleCancel = () => {
    setContent("");
    setShowInput(false);
  };

  const buttonText = level === 0 ? text : "Reply";
  const placeholder = level === 0 ? "Write a comment..." : "Write a reply...";

  return (
    <div className="mt-3">
      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            level === 0
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          {level === 0 ? (
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v8a2 2 0 002 2h8a2 2 0 002-2V8M9 12h6" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          )}
          {buttonText}
        </button>
      ) : (
        <div className={`rounded-lg border border-gray-200 bg-white p-3 ${level > 0 ? 'ml-2' : ''}`}>
          <div className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none"
              rows={level === 0 ? 3 : 2}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button
                  onClick={handleCommentSubmit}
                  disabled={isLoading || !content.trim()}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isLoading || !content.trim()
                      ? "cursor-not-allowed bg-gray-200 text-gray-400"
                      : "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </div>
                  ) : (
                    buttonText
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="text-xs text-gray-400">
                {content.length}/500
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};