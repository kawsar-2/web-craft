import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuthStore } from "../store";

export const Profile = () => {
  const { user } = useAuthStore();
  const params = useParams();
  // Accept both /profile and /profile/:userId
  const viewingUserId = params.userId || user?.id;
  const isViewingOther = !!params.userId && params.userId !== user?.id;

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (viewingUserId) {
      getProfilePicture(viewingUserId);
      fetchProfile(viewingUserId);
    }
    // eslint-disable-next-line
  }, [user, params.userId]);

  async function fetchProfile(id: string | undefined) {
    try {
      if (!id) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, phone, address, user_id")
        .eq("user_id", id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile((prev) => ({
          ...prev,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          phone: data.phone || "",
          address: data.address || "",
          email: !isViewingOther ? user?.email || "" : "",
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }

  async function getProfilePicture(id: string | undefined) {
    try {
      if (!id) return;
      const { data: fileList, error: listError } = await supabase.storage
        .from("profile-picture")
        .list(`${id}`);
      if (listError) {
        console.error("Error listing profile pictures:", listError);
        setAvatarUrl(null);
        return;
      }
      if (!fileList || fileList.length === 0) {
        setAvatarUrl(null);
        return;
      }
      const { data: file, error } = await supabase.storage
        .from("profile-picture")
        .download(`${id}/${fileList[0].name}`);
      if (error || !file) {
        setAvatarUrl(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    } catch (error) {
      setAvatarUrl(null);
    }
  }

  async function uploadProfilePicture(file: File) {
    try {
      setLoading(true);

      if (!user?.id) {
        console.error("User ID not available");
        return;
      }

      const { data: existingFiles, error: listError } = await supabase.storage
        .from("profile-picture")
        .list(`${user.id}`);

      if (listError) {
        console.error("Error listing existing files:", listError);
        throw listError;
      }

      if (existingFiles && existingFiles.length > 0) {
        const filePaths = existingFiles.map(
          (file) => `${user.id}/${file.name}`
        );

        const { error: deleteError } = await supabase.storage
          .from("profile-picture")
          .remove(filePaths);

        if (deleteError) {
          console.error("Error deleting existing files:", deleteError);
          throw deleteError;
        }
      }

      const fileName = `profile.${file.name.split(".").pop()}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-picture")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      await getProfilePicture(user.id);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert("Error uploading profile picture!");
    } finally {
      setLoading(false);
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadProfilePicture(file);
    }
  };

  const handleDeleteProfilePicture = async () => {
    try {
      setLoading(true);

      if (!user?.id) return;

      const { data: fileList, error: listError } = await supabase.storage
        .from("profile-picture")
        .list(`${user.id}`);

      if (listError) throw listError;

      if (!fileList || fileList.length === 0) {
        setAvatarUrl(null);
        return;
      }

      const filesToDelete = fileList.map((file) => `${user.id}/${file.name}`);

      const { error } = await supabase.storage
        .from("profile-picture")
        .remove(filesToDelete);

      if (error) throw error;

      setAvatarUrl(null);
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      alert("Error deleting profile picture!");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (!user?.id) return;

      const { error } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          address: profile.address,
        },
        {
          onConflict: "user_id",
        }
      );

      if (error) {
        console.error("Error saving profile:", error);
        alert("Failed to save profile information!");
        return;
      }

      alert("Profile information updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile information!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">
        {isViewingOther ? "User Profile" : "Your Profile"}
      </h1>

      <div className="mb-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl">
                  {profile.first_name
                    ? profile.first_name.charAt(0).toUpperCase()
                    : "U"}
                </div>
              )}
            </div>
          </div>
          {!isViewingOther && (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={loading}
                >
                  {avatarUrl ? "Change Picture" : "Upload Picture"}
                </button>
                {avatarUrl && (
                  <button
                    onClick={handleDeleteProfilePicture}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    disabled={loading}
                  >
                    Delete Picture
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <form
        onSubmit={
          isViewingOther ? (e) => e.preventDefault() : handleProfileUpdate
        }
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={profile.first_name}
              disabled={isViewingOther}
              onChange={(e) =>
                setProfile({ ...profile, first_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={profile.last_name}
              disabled={isViewingOther}
              onChange={(e) =>
                setProfile({ ...profile, last_name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={isViewingOther ? "" : profile.email}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={profile.phone}
            disabled={isViewingOther}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={profile.address}
            disabled={isViewingOther}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          ></textarea>
        </div>

        {!isViewingOther && (
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Profile"}
          </button>
        )}
      </form>
    </div>
  );
};
