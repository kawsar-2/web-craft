import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Heart,
  Share2,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../config/firebase";

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

  // Add image upload states
  const [shareImageFile, setShareImageFile] = useState<File | null>(null);
  const [shareImagePreview, setShareImagePreview] = useState<string | null>(
    null
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle image file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setShareError("Image must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setShareError("Please select an image file");
        return;
      }

      setShareImageFile(file);
      setShareError(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setShareImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeSelectedImage = () => {
    setShareImageFile(null);
    setShareImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload image to Supabase Storage instead
  const uploadImageToSupabase = async (file: File): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name.replace(
        /[^a-zA-Z0-9.-]/g,
        "_"
      )}`;
      const filePath = `post-images/${fileName}`;

      console.log("Uploading to Supabase Storage:", filePath);

      const { data, error } = await supabase.storage
        .from("post-image") // Changed from "post-images" to "post-image"
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("post-image") // Changed from "post-images" to "post-image"
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Supabase Storage upload error:", error);
      throw new Error(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Update the share handler to use Supabase
  const handleShare = async () => {
    setShareError(null);
    if (!shareTitle.trim() || !shareDescription.trim()) {
      setShareError("Title and description are required.");
      return;
    }

    if (!shareImageFile) {
      setShareError("Please select an image for your post.");
      return;
    }

    setShareLoading(true);
    setUploadingImage(true);

    try {
      // Upload image to Supabase Storage
      const imageUrl = await uploadImageToSupabase(shareImageFile);

      setUploadingImage(false);

      // Create the post
      const { error } = await supabase.from("posts").insert([
        {
          title: shareTitle,
          description: shareDescription,
          preview_image: imageUrl,
          user_id: authUser.id,
        },
      ]);

      if (error) {
        setShareError(`Database error: ${error.message}`);
      } else {
        // Reset form
        setShowShareModal(false);
        setShareTitle("");
        setShareDescription("");
        setShareImageFile(null);
        setShareImagePreview(null);
        setShareError(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchPosts();
      }
    } catch (err: any) {
      setShareError(err.message || "Failed to share post.");
      setUploadingImage(false);
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
        <div className="flex justify-between items-center mb-8">
          <div className="h-9 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
        </div>

        {/* Modern loading animation */}
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            {/* Outer spinning ring */}
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            {/* Inner pulsing dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="mt-4 text-gray-600 font-medium">
            Loading community posts...
          </div>
          <div className="mt-2 text-sm text-gray-400">
            Fetching the latest content from creators
          </div>
        </div>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Image skeleton */}
              <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
              <div className="p-4">
                {/* Title skeleton */}
                <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
                {/* Description skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6 animate-pulse"></div>
                </div>
                {/* Actions skeleton */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-12 animate-pulse"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-12 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-4 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading dots animation */}
        <div className="flex justify-center items-center mt-8">
          <div className="flex space-x-2">
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
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

      {/* Share Modal (Updated with image upload) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Share Your Work</h2>
            {shareError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {shareError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter a title for your work"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  disabled={shareLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your work"
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  disabled={shareLoading}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image *
                </label>

                {!shareImagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={shareLoading}
                    />
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-2">
                      Click to upload an image or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, GIF up to 5MB
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={shareLoading}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Choose File
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={shareImagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      disabled={shareLoading}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:bg-gray-400"
                    >
                      <X size={16} />
                    </button>
                    <div className="mt-2 text-sm text-gray-600">
                      {shareImageFile?.name}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:bg-gray-100"
                onClick={() => {
                  setShowShareModal(false);
                  setShareTitle("");
                  setShareDescription("");
                  setShareImageFile(null);
                  setShareImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                disabled={shareLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center"
                onClick={handleShare}
                disabled={
                  shareLoading ||
                  !shareTitle.trim() ||
                  !shareDescription.trim() ||
                  !shareImageFile
                }
              >
                {shareLoading ? (
                  <>
                    {uploadingImage ? (
                      <>
                        <Upload className="w-4 h-4 mr-2 animate-pulse" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Sharing...
                      </>
                    )}
                  </>
                ) : (
                  "Share"
                )}
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
