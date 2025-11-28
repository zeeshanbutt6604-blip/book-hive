import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Modal,
  KeyboardAvoidingView,
  FlatList,
  Dimensions,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Avatar from "@/components/Avatar";
import PostCard, { Post } from "@/components/PostCard";
import DarkTheme from "@/styles/theme";
import { usePosts } from "@/contexts/PostsContext";
import { authService } from "@/services/authService";
import { postService } from "@/services/postService";
import { userService } from "@/services/userService";
import Loader from "@/components/Loader";
import Button from "@/components/Button";
import InputField from "@/components/InputField";
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from "react-native-responsive-dimensions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const GRID_GAP = 2;
const PADDING_HORIZONTAL = 16; // padding from postsSection
// Calculate item size: screen width minus padding on both sides, minus gaps between items
const GRID_ITEM_SIZE = Math.floor((SCREEN_WIDTH - (PADDING_HORIZONTAL * 2) - (GRID_GAP * (GRID_COLUMNS - 1))) / GRID_COLUMNS);

// Edit Profile Modal Component
interface EditProfileModalProps {
  user: any;
  initialName?: string;
  initialImage?: string | null;
  onClose: () => void;
  onSave: (updatedUser: any) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ 
  user, 
  initialName,
  initialImage,
  onClose, 
  onSave 
}) => {
  const [name, setName] = useState(initialName || user?.name || "");
  const [profileImage, setProfileImage] = useState<string | null>(initialImage || null);
  const [errors, setErrors] = useState({ name: "" });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Update name when user or initialName changes
  useEffect(() => {
    if (initialName !== undefined) {
      setName(initialName);
    } else if (user?.name) {
      setName(user.name);
    }
  }, [user, initialName]);

  // Update image when initialImage changes
  useEffect(() => {
    if (initialImage !== undefined) {
      setProfileImage(initialImage);
    }
  }, [initialImage]);

  const requestImagePickerPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photo library to set a profile picture."
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async (source: "camera" | "library") => {
    try {
      const hasPermission = await requestImagePickerPermission();
      if (!hasPermission) return;

      let result;
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "We need access to your camera to take a photo."
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      "Change Profile Picture",
      "Select an option",
      [
        {
          text: "Camera",
          onPress: () => pickImage("camera"),
        },
        {
          text: "Photo Library",
          onPress: () => pickImage("library"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const validate = () => {
    const newErrors = { name: "" };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    try {
      setSaving(true);
      
      // Update profile with name and/or image
      const response = await userService.updateProfile(
        name.trim(),
        profileImage
      );

      if (response.success && response.user) {
        // Update AsyncStorage
        const USER_DATA_KEY = "@user_data";
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
        
        Alert.alert("Success", "Profile updated successfully!");
        onSave(response.user);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const currentImageUri = profileImage 
    ? profileImage 
    : (user?.profile_picture 
      ? userService.getFileUrl(user.profile_picture) 
      : undefined);

  return (
    <SafeAreaView style={editModalStyles.container}>
      <LinearGradient
        colors={[DarkTheme.colors.surface, DarkTheme.colors.background]}
        style={editModalStyles.header}
      >
        <TouchableOpacity onPress={onClose} style={editModalStyles.closeButton}>
          <MaterialIcons name="close" size={28} color={DarkTheme.colors.text} />
        </TouchableOpacity>
        <Text style={editModalStyles.headerTitle}>Edit Profile</Text>
        <View style={editModalStyles.placeholder} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={editModalStyles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={editModalStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={editModalStyles.avatarSection}>
            <TouchableOpacity
              onPress={handleImagePicker}
              disabled={uploadingImage}
              activeOpacity={0.8}
              style={editModalStyles.avatarTouchable}
            >
              <Avatar
                uri={currentImageUri}
                name={name || user?.name || "Unknown"}
                size={120}
              />
              <View style={editModalStyles.editImageIconContainer}>
                <MaterialIcons
                  name="camera-alt"
                  size={24}
                  color={DarkTheme.colors.white}
                />
              </View>
              {uploadingImage && (
                <View style={editModalStyles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={DarkTheme.colors.white} />
                </View>
              )}
            </TouchableOpacity>
            <Text style={editModalStyles.avatarHint}>Tap to change photo</Text>
          </View>

          <View style={editModalStyles.formSection}>
            <InputField
              label="Name"
              placeholder="Enter your name"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setErrors({ ...errors, name: "" });
              }}
              error={errors.name}
              containerStyle={editModalStyles.input}
              autoCapitalize="words"
            />

            <Button
              title={saving ? "Saving..." : "Save Changes"}
              onPress={handleSave}
              disabled={saving || uploadingImage}
              customStyle={editModalStyles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { posts, getUserPosts, deletePost, refreshPosts } = usePosts();
  const [user, setUser] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingProfileImage, setEditingProfileImage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  // Refresh posts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user && currentUserId) {
        const targetUserId = userId || currentUserId;
        refreshPosts().then(() => {
          const userPostsList = getUserPosts(targetUserId);
          updateUserPostsList(userPostsList);
        });
      }
    }, [user, currentUserId, userId])
  );

  // Helper function to transform and update user posts
  const updateUserPostsList = (userPostsList: Post[]) => {
    // Transform posts for PostCard
    const transformedPosts = userPostsList.map((post) => {
      // Handle null/undefined userId
      let userIdObj: any;
      if (post.userId && typeof post.userId === "object" && post.userId !== null) {
        userIdObj = post.userId;
      } else if (post.userId) {
        userIdObj = { _id: post.userId, name: "", email: "" };
      } else {
        userIdObj = { _id: null, name: "Unknown", email: "" };
      }
      
      const profilePicture = (userIdObj && typeof userIdObj === "object" && userIdObj.profile_picture)
        ? userIdObj.profile_picture
        : post.userAvatar;
      
      return {
        ...post,
        id: post._id || post.id,
        userId: (userIdObj && typeof userIdObj === "object" && userIdObj._id) ? userIdObj._id : post.userId,
        userName: (userIdObj && typeof userIdObj === "object" && userIdObj.name) ? userIdObj.name : (post.userName || "Unknown"),
        userAvatar: profilePicture ? userService.getFileUrl(profilePicture) : undefined,
        previewImage: post.previewimage ? postService.getFileUrl(post.previewimage) : post.previewImage,
        pdfUrl: post.fileUrl ? postService.getFileUrl(post.fileUrl) : post.pdfUrl,
        referredLink: post.linkUrl || post.referredLink,
        bookType: mapBookType(post.bookType),
        commentCount: post.commentCount || 0,
      };
    });
    
    setUserPosts(transformedPosts);
  };

  // Update userPosts when posts change (e.g., after adding a new post)
  useEffect(() => {
    if (user && currentUserId) {
      const targetUserId = userId || currentUserId;
      const userPostsList = getUserPosts(targetUserId);
      updateUserPostsList(userPostsList);
    }
  }, [posts, user, currentUserId, userId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const currentUserData = await authService.getUserData();
      const currentUserIdValue = currentUserData?._id || null;
      setCurrentUserId(currentUserIdValue);

      // Determine if viewing own profile or another user's profile
      const targetUserId = userId || currentUserIdValue;
      const viewingOwnProfile = !userId || targetUserId === currentUserIdValue;
      setIsOwnProfile(viewingOwnProfile);

      if (viewingOwnProfile && currentUserIdValue) {
        // Own profile - fetch fresh data from API
        try {
          const response = await authService.getCurrentUser();
          if (response.success && response.user) {
            setUser(response.user);
            // Update AsyncStorage with fresh data
            const USER_DATA_KEY = "@user_data";
            await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
          } else if (currentUserData) {
            // Fallback to AsyncStorage if API fails
            setUser(currentUserData);
          }
        } catch (error) {
          console.error("Error fetching current user:", error);
          // Fallback to AsyncStorage if API fails
          if (currentUserData) {
            setUser(currentUserData);
          }
        }
      } else if (targetUserId) {
        // Public profile - fetch user data
        try {
          const response = await userService.getUserById(targetUserId);
          if (response.success && response.user) {
            setUser(response.user);
          } else {
            throw new Error("User not found");
          }
        } catch (error) {
          // Fallback: try to get user from posts
          await refreshPosts();
          const allPosts = getUserPosts(targetUserId);
          if (allPosts.length > 0) {
            const firstPost = allPosts[0];
            // Handle null/undefined userId
            let postUserId: any;
            if (firstPost.userId && typeof firstPost.userId === "object" && firstPost.userId !== null) {
              postUserId = firstPost.userId;
            } else if (firstPost.userId) {
              postUserId = { _id: firstPost.userId, name: "", email: "" };
            } else {
              postUserId = { _id: null, name: "Unknown", email: "" };
            }
            
            setUser({
              _id: targetUserId,
              name: (postUserId && typeof postUserId === "object" && postUserId.name) ? postUserId.name : "Unknown",
              email: (postUserId && typeof postUserId === "object" && postUserId.email) ? postUserId.email : "",
              profile_picture: (postUserId && typeof postUserId === "object" && postUserId.profile_picture) 
                ? postUserId.profile_picture 
                : undefined,
            });
          } else {
            throw new Error("User not found");
          }
        }
      }

      // Load user posts
      await loadUserPosts(targetUserId);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load profile");
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async (targetUserId: string | null) => {
    if (!targetUserId) return;

    try {
      await refreshPosts();
      const posts = getUserPosts(targetUserId);
      
      // Transform posts for PostCard
      const transformedPosts = posts.map((post) => {
        // Handle null/undefined userId
        let userId: any;
        if (post.userId && typeof post.userId === "object" && post.userId !== null) {
          userId = post.userId;
        } else if (post.userId) {
          userId = { _id: post.userId, name: "", email: "" };
        } else {
          userId = { _id: null, name: "Unknown", email: "" };
        }
        
        const profilePicture = (userId && typeof userId === "object" && userId.profile_picture)
          ? userId.profile_picture
          : post.userAvatar;
        
        return {
          ...post,
          id: post._id || post.id,
          userId: (userId && typeof userId === "object" && userId._id) ? userId._id : post.userId,
          userName: (userId && typeof userId === "object" && userId.name) ? userId.name : (post.userName || "Unknown"),
          userAvatar: profilePicture ? userService.getFileUrl(profilePicture) : undefined,
          previewImage: post.previewimage ? postService.getFileUrl(post.previewimage) : post.previewImage,
          pdfUrl: post.fileUrl ? postService.getFileUrl(post.fileUrl) : post.pdfUrl,
          referredLink: post.linkUrl || post.referredLink,
          bookType: mapBookType(post.bookType),
          commentCount: post.commentCount || 0,
        };
      });
      
      setUserPosts(transformedPosts);
    } catch (error) {
      console.error("Error loading user posts:", error);
    }
  };

  const mapBookType = (type: string): "Manual" | "Donate" | "Referred Link" => {
    switch (type) {
      case "pdf":
      case "epub":
      case "document":
        return "Manual";
      case "image":
        return "Donate";
      case "referred_link":
        return "Referred Link";
      default:
        return "Manual";
    }
  };

  const getBookTypeColor = (type: string) => {
    switch (type) {
      case "Manual":
        return "#FFE66D";
      case "Donate":
        return "#C77DFF";
      case "Referred Link":
        return "#6C5CE7";
      default:
        return DarkTheme.colors.primary;
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handlePostPress = (post: Post) => {
    const postId = post._id || post.id;
    router.push(`/(routes)/postdetail?postId=${postId}` as any);
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(postId);
            await loadUserPosts(currentUserId);
            Alert.alert("Success", "Post deleted successfully");
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete post");
          }
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await authService.logout();
            router.replace("/(routes)/signin");
          } catch (error) {
            console.error("Error signing out:", error);
            router.replace("/(routes)/signin");
          }
        },
      },
    ]);
  };

  const requestImagePickerPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "We need access to your photo library to set a profile picture."
        );
        return false;
      }
    }
    return true;
  };

  const handleEditProfilePicture = async () => {
    if (!isOwnProfile) return;

    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) return;

    Alert.alert(
      "Change Profile Picture",
      "Select an option",
      [
        {
          text: "Camera",
          onPress: () => pickImage("camera"),
        },
        {
          text: "Photo Library",
          onPress: () => pickImage("library"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const pickImage = async (source: "camera" | "library") => {
    try {
      let result;
      
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "We need access to your camera to take a photo."
          );
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadProfilePicture(selectedImage.uri);
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      
      const response = await userService.updateProfilePicture(imageUri, user?.name);
      
      if (response.success && response.user) {
        // Update local user state
        setUser(response.user);
        
        // Update stored user data in AsyncStorage
        const USER_DATA_KEY = "@user_data";
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(response.user));
        
        Alert.alert("Success", "Profile picture updated successfully!");
        
        // Reload profile to get updated data
        await loadProfile();
      } else {
        throw new Error(response.message || "Failed to update profile picture");
      }
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile picture. Please try again."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Loader />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>User not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            disabled={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[DarkTheme.colors.surface, DarkTheme.colors.background]}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={DarkTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        {isOwnProfile ? (
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <MaterialIcons
              name="logout"
              size={24}
              color={DarkTheme.colors.text}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {isOwnProfile ? (
              <TouchableOpacity
                onPress={() => {
                  // Open Edit Profile modal when avatar is tapped
                  if (user) {
                    setEditingName(user.name || "");
                    setEditingProfileImage(null);
                    setShowEditModal(true);
                  }
                }}
                disabled={uploadingImage}
                activeOpacity={0.8}
                style={styles.avatarTouchable}
              >
                <Avatar
                  uri={
                    user.profile_picture
                      ? userService.getFileUrl(user.profile_picture)
                      : undefined
                  }
                  name={user.name || "Unknown"}
                  size={100}
                />
                {uploadingImage && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={DarkTheme.colors.white} />
                  </View>
                )}
                {!uploadingImage && (
                  <View style={styles.editIconContainer}>
                    <MaterialIcons
                      name="edit"
                      size={20}
                      color={DarkTheme.colors.white}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ) : (
              <Avatar
                uri={
                  user.profile_picture
                    ? userService.getFileUrl(user.profile_picture)
                    : undefined
                }
                name={user.name || "Unknown"}
                size={100}
              />
            )}
          </View>
          <Text style={styles.userName}>{user.name || "Unknown"}</Text>
          <Text style={styles.userEmail}>{user.email || ""}</Text>
        </View>

        <View style={styles.postsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isOwnProfile ? "My Posts" : "Posts"}
            </Text>
            <Text style={styles.postCount}>({userPosts.length})</Text>
          </View>

          <FlatList
            data={userPosts}
            numColumns={GRID_COLUMNS}
            keyExtractor={(item) => item._id || item.id || String(Math.random())}
            renderItem={({ item: post, index }) => {
              const isLastInRow = (index + 1) % GRID_COLUMNS === 0;
              return (
                <TouchableOpacity
                  style={[
                    styles.gridItem,
                    isLastInRow && styles.gridItemLastInRow
                  ]}
                  onPress={() => handlePostPress(post)}
                  activeOpacity={0.8}
                >
                  {post.previewImage ? (
                    <ExpoImage
                      source={{ uri: post.previewImage }}
                      style={styles.gridImage}
                      contentFit="cover"
                      transition={200}
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.gridPlaceholder}>
                      {post.bookType === "Manual" ? (
                        <MaterialIcons
                          name="picture-as-pdf"
                          size={32}
                          color={DarkTheme.colors.primary}
                        />
                      ) : post.bookType === "Referred Link" ? (
                        <MaterialIcons
                          name="link"
                          size={32}
                          color={DarkTheme.colors.primary}
                        />
                      ) : (
                        <MaterialIcons
                          name="auto-stories"
                          size={32}
                          color={DarkTheme.colors.primary}
                        />
                      )}
                    </View>
                  )}
                  {/* Book type indicator overlay */}
                  <View style={styles.gridOverlay}>
                    <View
                      style={[
                        styles.gridTypeBadge,
                        { backgroundColor: getBookTypeColor(post.bookType) },
                      ]}
                    >
                      <Text style={styles.gridTypeText} numberOfLines={1}>
                        {post.bookType}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={[
              styles.postsListContent,
              userPosts.length === 0 && styles.emptyListContent
            ]}
            columnWrapperStyle={userPosts.length > 0 ? styles.gridRow : undefined}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="auto-stories"
                  size={64}
                  color={DarkTheme.colors.disabled}
                />
                <Text style={styles.emptyText}>No posts yet</Text>
                <Text style={styles.emptySubtext}>
                  {isOwnProfile
                    ? "Start sharing books to see them here!"
                    : "This user hasn't shared any books yet."}
                </Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingName("");
          setEditingProfileImage(null);
        }}
      >
        <EditProfileModal
          user={user}
          initialName={editingName}
          initialImage={editingProfileImage}
          onClose={() => {
            setShowEditModal(false);
            setEditingName("");
            setEditingProfileImage(null);
          }}
          onSave={async (updatedUser) => {
            console.log("Profile updated, new user data:", updatedUser);
            // Update user state immediately with merged data
            if (updatedUser) {
              setUser((prevUser: any) => ({
                ...prevUser,
                ...updatedUser,
                name: updatedUser.name || prevUser?.name, // Ensure name is updated
              }));
              // Also update AsyncStorage with new data
              const USER_DATA_KEY = "@user_data";
              await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify({
                ...updatedUser,
                name: updatedUser.name,
              }));
            }
            // Reload profile to ensure everything is in sync
            await loadProfile();
            // Close modal and reset
            setShowEditModal(false);
            setEditingName("");
            setEditingProfileImage(null);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: DarkTheme.colors.text,
  },
  signOutButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  contentContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarTouchable: {
    position: "relative",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: DarkTheme.colors.background,
    zIndex: 10,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: DarkTheme.colors.subtext,
  },
  postsSection: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  postsListContent: {
    paddingBottom: 40,
    alignItems: "flex-start",
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  gridRow: {
    justifyContent: "flex-start",
    paddingHorizontal: 0,
    width: "100%",
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    marginRight: GRID_GAP,
    marginBottom: GRID_GAP,
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
    flex: 0,
    flexShrink: 0,
    flexGrow: 0,
  },
  gridItemLastInRow: {
    marginRight: 0,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    backgroundColor: DarkTheme.colors.border,
  },
  gridPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: DarkTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
  },
  gridOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 4,
  },
  gridTypeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: GRID_ITEM_SIZE - 8,
  },
  gridTypeText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#fff",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    marginRight: 8,
  },
  postCount: {
    fontSize: 16,
    color: DarkTheme.colors.subtext,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: DarkTheme.colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: DarkTheme.colors.subtext,
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: DarkTheme.colors.subtext,
    marginBottom: 20,
  },
});

// Edit Profile Modal Styles
const editModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveScreenWidth(4),
    paddingVertical: responsiveScreenHeight(2),
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 36,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: responsiveScreenHeight(4),
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: responsiveScreenHeight(4),
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  avatarTouchable: {
    position: "relative",
    marginBottom: responsiveScreenHeight(1.5),
  },
  editImageIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: DarkTheme.colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: DarkTheme.colors.background,
    zIndex: 10,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  avatarHint: {
    fontSize: responsiveFontSize(1.6),
    color: DarkTheme.colors.subtext,
    marginTop: responsiveScreenHeight(1),
  },
  formSection: {
    padding: responsiveScreenWidth(4),
  },
  input: {
    marginBottom: responsiveScreenHeight(2),
  },
  saveButton: {
    marginTop: responsiveScreenHeight(2),
  },
});

export default ProfileScreen;
