import React, { useState, useEffect } from "react";
import { MessageSquare, Heart, Share2, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

interface Post {
  id: string;
  title: string;
  description: string;
  preview_image: string;
  user_id: string;
  created_at: string;
  likes: number;
  comments: number;
}

export const Community = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<any>(null);

  // Add modal state for sharing work
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareImage, setShareImage] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // Add modal state for comments
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [likeLoading, setLikeLoading] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUser(session?.user ?? null);
      }
    );
    // Get current user on mount
    supabase.auth.getUser().then(({ data }) => setAuthUser(data?.user ?? null));
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    checkConnectionAndFetch();
    // eslint-disable-next-line
  }, [authUser]);

  const checkConnectionAndFetch = async () => {
    setLoading(true);
    try {
      // Check connection
      const { error } = await supabase.from("posts").select("id").limit(1);
      setIsConnected(!error);
      if (!error) {
        fetchPosts();
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts with like and comment counts
  const fetchPosts = async () => {
    setLoading(true);
    // Fetch posts
    const { data: postsData, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && postsData) {
      // For each post, fetch like and comment counts
      const postsWithCounts = await Promise.all(
        postsData.map(async (post: Post) => {
          // Like count
          const { count: likeCount } = await supabase
            .from("likes")
            .select("id", { count: "exact", head: true })
            .eq("post_id", post.id);
          // Comment count
          const { count: commentCount } = await supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("post_id", post.id);
          return {
            ...post,
            likes: likeCount || 0,
            comments: commentCount || 0,
          };
        })
      );
      setPosts(postsWithCounts);
    }
    setLoading(false);
  };

  // Share post handler
  const handleShare = async () => {
    setShareError(null);
    if (!shareTitle.trim() || !shareDescription.trim() || !shareImage.trim()) {
      setShareError("All fields are required.");
      return;
    }
    setShareLoading(true);
    try {
      const { error } = await supabase.from("posts").insert([
        {
          title: shareTitle,
          description: shareDescription,
          preview_image: shareImage,
          user_id: authUser.id,
          likes: 0,
          comments: 0,
        },
      ]);
      if (error) {
        setShareError(error.message);
      } else {
        setShowShareModal(false);
        setShareTitle("");
        setShareDescription("");
        setShareImage("");
        fetchPosts();
      }
    } catch (err: any) {
      setShareError(err.message || "Failed to share post.");
    }
    setShareLoading(false);
  };

  // Fetch comments for a post (get user info manually, not via join)
  const fetchComments = async (postId: string) => {
    setCommentLoading(true);
    setCommentError(null);
    // 1. Get all comments for the post
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error || !commentsData) {
      setCommentError(error?.message || "Failed to load comments.");
      setComments([]);
      setCommentLoading(false);
      return;
    }

    // 2. Get unique user_ids from comments (filter out null/undefined)
    const userIds = Array.from(
      new Set(commentsData.map((c) => c.user_id).filter(Boolean))
    );

    // 3. Fetch profiles for those user_ids (use user_id column, not id)
    const profilesMap: Record<
      string,
      { first_name?: string; last_name?: string }
    > = {};
    if (userIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      if (profilesData) {
        profilesData.forEach((profile: any) => {
          profilesMap[String(profile.user_id)] = {
            first_name: profile.first_name,
            last_name: profile.last_name,
          };
        });
      }
    }

    // 4. Attach profile info to each comment
    const commentsWithNames = commentsData.map((c) => ({
      ...c,
      first_name: profilesMap[String(c.user_id)]?.first_name,
      last_name: profilesMap[String(c.user_id)]?.last_name,
    }));

    setComments(commentsWithNames);
    setCommentLoading(false);
  };

  // Handle opening comments modal
  const handleOpenComments = (post: Post) => {
    setCurrentPost(post);
    setShowCommentsModal(true);
    fetchComments(post.id);
  };

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!authUser || !commentInput.trim() || !currentPost) return;
    setCommentLoading(true);
    setCommentError(null);
    try {
      const { error } = await supabase.from("comments").insert([
        {
          post_id: currentPost.id,
          user_id: authUser.id,
          content: commentInput.trim(),
        },
      ]);
      if (error) {
        setCommentError(error.message);
      } else {
        setCommentInput("");
        fetchComments(currentPost.id);
      }
    } catch (err: any) {
      setCommentError(err.message || "Failed to add comment.");
    }
    setCommentLoading(false);
  };

  // Handle like
  const handleLike = async (post: Post) => {
    if (!authUser) return;
    setLikeLoading(post.id);
    // Check if user already liked
    const { data: existingLike, error: likeError } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", post.id)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (likeError) {
      setLikeLoading(null);
      return;
    }

    if (existingLike && existingLike.id) {
      // Unlike (delete)
      await supabase.from("likes").delete().eq("id", existingLike.id);
    } else {
      // Like (insert)
      await supabase
        .from("likes")
        .insert([{ post_id: post.id, user_id: authUser.id }]);
    }
    // Refresh posts to update like count
    fetchPosts();
    setLikeLoading(null);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Community Page</h1>
          <button
            disabled
            className="px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
          >
            Create a Post
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-blue-700 mb-2">
            Connect to Supabase
          </h2>
          <p className="text-blue-600 mb-4">
            To enable community features, please connect your project to
            Supabase using the "Connect to Supabase" button in the top right.
          </p>
          <p className="text-sm text-blue-500">
            Once connected, you'll be able to share your work and interact with
            other creators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Community Showcase</h1>
        <button
          className={`px-4 py-2 rounded-lg transition-colors ${
            authUser
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-400 text-white cursor-not-allowed"
          }`}
          disabled={!authUser}
          onClick={() => authUser && setShowShareModal(true)}
        >
          Share Your Work
        </button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Share Your Work</h2>
            {shareError && (
              <div className="mb-2 text-red-600 text-sm">{shareError}</div>
            )}
            <input
              className="w-full mb-3 p-2 border rounded"
              placeholder="Title"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              disabled={shareLoading}
            />
            <textarea
              className="w-full mb-3 p-2 border rounded"
              placeholder="Description"
              value={shareDescription}
              onChange={(e) => setShareDescription(e.target.value)}
              disabled={shareLoading}
              rows={3}
            />
            <input
              className="w-full mb-3 p-2 border rounded"
              placeholder="Image URL"
              value={shareImage}
              onChange={(e) => setShareImage(e.target.value)}
              disabled={shareLoading}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowShareModal(false)}
                disabled={shareLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleShare}
                disabled={shareLoading}
              >
                {shareLoading ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          No posts yet. Be the first to share your work!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <img
                src={post.preview_image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{post.description}</p>
                <div className="flex items-center justify-between text-gray-500 text-sm">
                  <div className="flex items-center gap-4">
                    <button
                      className={`flex items-center gap-1 hover:text-red-500 ${
                        likeLoading === post.id
                          ? "opacity-50 pointer-events-none"
                          : ""
                      }`}
                      onClick={() => handleLike(post)}
                      disabled={!authUser || likeLoading === post.id}
                    >
                      <Heart className="w-4 h-4" />
                      {post.likes}
                    </button>
                    <button
                      className="flex items-center gap-1 hover:text-blue-500"
                      onClick={() => handleOpenComments(post)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      {post.comments}
                    </button>
                  </div>
                  <button className="hover:text-blue-500">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comments Modal */}
      {showCommentsModal && currentPost && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowCommentsModal(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-2">{currentPost.title}</h2>
            <div className="mb-4 text-gray-600">{currentPost.description}</div>
            <div className="mb-4">
              <img
                src={currentPost.preview_image}
                alt={currentPost.title}
                className="w-full h-40 object-cover rounded"
              />
            </div>
            <div className="mb-2 font-semibold">Comments</div>
            <div className="max-h-40 overflow-y-auto mb-4 border rounded p-2 bg-gray-50">
              {commentLoading ? (
                <div className="text-gray-400">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-gray-400">No comments yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="mb-2">
                    <span className="font-semibold">
                      {c.first_name || c.last_name ? (
                        <a
                          href={`/profile/${c.user_id}`}
                          className="hover:underline text-blue-700"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {`${c.first_name || ""} ${c.last_name || ""}`.trim()}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {c.user_id}
                        </span>
                      )}
                    </span>
                    <span className="ml-2">{c.content}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
              {commentError && (
                <div className="text-red-500 text-sm">{commentError}</div>
              )}
            </div>
            {authUser && (
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded p-2"
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  disabled={commentLoading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddComment();
                  }}
                />
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleAddComment}
                  disabled={commentLoading || !commentInput.trim()}
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
