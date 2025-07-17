import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store";
import { supabase } from "../lib/supabase";

export const ProfileIcon = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    async function getProfilePicture() {
      if (user?.id) {
        try {
          // First list files in the user's folder
          const { data: fileList, error: listError } = await supabase.storage
            .from("profile-picture")
            .list(`${user.id}`);

          if (listError) {
            console.error("Error listing profile pictures:", listError);
            return;
          }

          // If no files found, return
          if (!fileList || fileList.length === 0) return;

          // Download the first file found
          const { data: file, error } = await supabase.storage
            .from("profile-picture")
            .download(`${user.id}/${fileList[0].name}`);

          if (error) {
            console.error("Error downloading profile picture:", error);
            return;
          }

          if (file) {
            const url = URL.createObjectURL(file);
            setAvatarUrl(url);
          }
        } catch (error) {
          console.error("Error fetching profile picture:", error);
        }
      }
    }

    async function getUserProfile() {
      if (user?.id) {
        try {
          // Get profile data
          const { data, error } = await supabase
            .from("profiles")
            .select("first_name, last_name")
            .eq("user_id", user.id)
            .single();

          if (!error && data) {
            // Format name based on available data
            const firstName = data.first_name || "";
            const lastName = data.last_name || "";

            if (firstName || lastName) {
              setProfileName(`${firstName} ${lastName}`.trim());
            } else {
              // Fallback to email username if no name set
              setProfileName(user.email?.split("@")[0] || "User");
            }
          } else {
            // Fallback to email username
            setProfileName(user.email?.split("@")[0] || "User");
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          setProfileName(user.email?.split("@")[0] || "User");
        }
      }
    }

    getUserProfile();
    getProfilePicture();
  }, [user]);

  const handleClick = () => {
    navigate("/profile");
  };

  if (location.pathname === "/") return null;

  return (
    <div
      className="absolute top-2 left-4 flex items-center gap-3 cursor-pointer group"
      onClick={handleClick}
    >
      {/* Profile picture circle */}
      <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
      </div>

      {/* Profile name next to the icon */}
      <span className="font-medium text-gray-800 hidden sm:inline-block">
        {profileName}
      </span>
    </div>
  );
};
