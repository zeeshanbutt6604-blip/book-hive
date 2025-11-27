import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import PostCard, { Post } from "@/components/PostCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import DarkTheme from "@/styles/theme";
import { usePosts } from "@/contexts/PostsContext";
import AddPostScreen from "./AddPost";
import { postService } from "@/services/postService";
import { userService } from "@/services/userService";
import Loader from "@/components/Loader";

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { posts, loading, refreshPosts } = usePosts();
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshPosts();
  }, []);

  const handlePostPress = (post: Post) => {
    const postId = post._id || post.id;
    router.push(`/(routes)/postdetail?postId=${postId}` as any);
  };

  const handleAvatarPress = (post: Post) => {
    const userId = post.userId;
    if (userId) {
      router.push(`/(routes)/profile?userId=${userId}` as any);
    }
  };

  const handleAddPost = () => {
    setShowAddPostModal(true);
  };

  const handlePostAdded = async () => {
    setShowAddPostModal(false);
    await refreshPosts();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  };

  // Transform post for PostCard component
  const transformPostForCard = (post: Post): Post => {
    // Handle null/undefined userId
    let userId: any;
    if (post.userId && typeof post.userId === "object" && post.userId !== null) {
      userId = post.userId;
    } else if (post.userId) {
      userId = { _id: post.userId, name: "", email: "" };
    } else {
      userId = { _id: null, name: "Unknown", email: "" };
    }
    
    // Convert profile picture to full URL if it exists
    const profilePicture = (userId && typeof userId === "object" && userId.profile_picture) 
      ? userId.profile_picture 
      : post.userAvatar;
    const userAvatar = profilePicture ? userService.getFileUrl(profilePicture) : undefined;
    
    return {
      ...post,
      id: post._id || post.id,
      userId: (userId && typeof userId === "object" && userId._id) ? userId._id : post.userId,
      userName: (userId && typeof userId === "object" && userId.name) ? userId.name : (post.userName || "Unknown"),
      userAvatar: userAvatar,
      previewImage: post.previewimage ? postService.getFileUrl(post.previewimage) : post.previewImage,
      pdfUrl: post.fileUrl ? postService.getFileUrl(post.fileUrl) : post.pdfUrl,
      pdfName: post.pdfName,
      referredLink: post.linkUrl || post.referredLink,
      bookType: mapBookType(post.bookType),
      commentCount: post.commentCount || 0,
    };
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

  const renderHeader = () => (
    <LinearGradient
      colors={[DarkTheme.colors.surface, DarkTheme.colors.background]}
      style={styles.header}
    >
      <View style={styles.headerContent}>
        <MaterialIcons
          name="auto-stories"
          size={32}
          color={DarkTheme.colors.primary}
        />
        <Text style={styles.headerTitle}>Books Feed</Text>
      </View>
    </LinearGradient>
  );

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <Loader />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <FlatList
        data={posts}
        renderItem={({ item }) => {
          const transformedPost = transformPostForCard(item);
          return (
            <PostCard
              post={transformedPost}
              onPress={() => handlePostPress(item)}
              onAvatarPress={() => handleAvatarPress(transformedPost)}
            />
          );
        }}
        keyExtractor={(item) => item._id || item.id || ""}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="auto-stories"
              size={64}
              color={DarkTheme.colors.disabled}
            />
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first to share a book!
            </Text>
          </View>
        }
      />
      <FloatingActionButton
        onPress={handleAddPost}
        icon="add"
        style={styles.fab}
      />

      <Modal
        visible={showAddPostModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddPostModal(false)}
      >
        <AddPostScreen
          onPostAdded={handlePostAdded}
          onClose={() => setShowAddPostModal(false)}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    marginLeft: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
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
  },
  fab: {
    right: 20,
    bottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
