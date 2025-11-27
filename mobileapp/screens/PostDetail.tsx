import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from "react-native-responsive-dimensions";
import Avatar from "@/components/Avatar";
import CommentItem, { Comment } from "@/components/CommentItem";
import Button from "@/components/Button";
import DarkTheme from "@/styles/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
import { usePosts } from "@/contexts/PostsContext";
import { postService } from "@/services/postService";
import { commentService } from "@/services/commentService";
import { authService } from "@/services/authService";
import { userService } from "@/services/userService";
import { Post } from "@/components/PostCard";

const PostDetailScreen: React.FC = () => {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { getPostById, deletePost, refreshPosts } = usePosts();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [fullImageVisible, setFullImageVisible] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
    loadCurrentUser();
  }, [postId]);

  const loadCurrentUser = async () => {
    try {
      const userData = await authService.getUserData();
      if (userData && userData._id) {
        setCurrentUserId(userData._id);
      }
    } catch (error) {
      console.log("Error loading current user:", error);
    }
  };

  const loadPost = async () => {
    try {
      setLoading(true);
      if (postId) {
        const response = await postService.getPostById(postId);
        if (response.success && response.post) {
          const apiPost = response.post;
          const userId = typeof apiPost.userId === "object" ? apiPost.userId : { _id: apiPost.userId, name: "", email: "" };
          
          // Determine if this is a PDF post (has fileUrl and bookType is pdf/epub/document)
          const hasPdfFile = apiPost.fileUrl && 
            (apiPost.bookType === "pdf" || apiPost.bookType === "epub" || apiPost.bookType === "document");
          
          // Handle null/undefined userId
          let postUserId: any;
          if (apiPost.userId && typeof apiPost.userId === "object" && apiPost.userId !== null) {
            postUserId = apiPost.userId;
          } else if (apiPost.userId) {
            postUserId = { _id: apiPost.userId, name: "Unknown", email: "" };
          } else {
            postUserId = { _id: null, name: "Unknown", email: "" };
          }
          
          const profilePicture = (postUserId && typeof postUserId === "object" && postUserId.profile_picture)
            ? postUserId.profile_picture
            : undefined;
          
          const transformedPost: Post = {
            ...apiPost,
            id: apiPost._id,
            userId: (postUserId && typeof postUserId === "object" && postUserId._id) ? postUserId._id : apiPost.userId,
            userName: (postUserId && typeof postUserId === "object" && postUserId.name) ? postUserId.name : "Unknown",
            userAvatar: profilePicture ? userService.getFileUrl(profilePicture) : undefined,
            previewImage: apiPost.previewimage ? postService.getFileUrl(apiPost.previewimage) : undefined,
            pdfUrl: hasPdfFile ? postService.getFileUrl(apiPost.fileUrl) : undefined,
            pdfName: hasPdfFile ? apiPost.fileUrl.split("/").pop() || undefined : undefined,
            referredLink: apiPost.linkUrl,
            bookType: mapBookType(apiPost.bookType),
            commentCount: comments.length,
            createdAt: apiPost.createdAt ? new Date(apiPost.createdAt).toLocaleString() : "Unknown",
          };
          setPost(transformedPost);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load post", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      if (postId) {
        const response = await commentService.getComments(postId);
        if (response.success && response.comments) {
        const transformedComments = response.comments.map((comment: any) => {
          // Handle null/undefined userId
          let userId: any;
          if (comment.userId && typeof comment.userId === "object" && comment.userId !== null) {
            userId = comment.userId;
          } else if (comment.userId) {
            userId = { _id: comment.userId };
          } else {
            userId = { _id: null, name: "Unknown", email: "" };
          }
          
          const profilePicture = (userId && typeof userId === "object" && userId.profile_picture) 
            ? userId.profile_picture 
            : undefined;
          
          return {
            ...comment,
            id: comment._id,
            userId: userId,
            userAvatar: profilePicture ? userService.getFileUrl(profilePicture) : undefined,
            createdAt: comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown",
          };
        });
          setComments(transformedComments);
        }
      }
    } catch (error: any) {
      console.error("Error loading comments:", error);
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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPost(), loadComments()]);
    setRefreshing(false);
  };

  // Check if current user is the post owner - delete button should only show for post owner
  const isOwner = post && currentUserId ? (() => {
    const postUserId = typeof post.userId === "object" && post.userId !== null 
      ? (post.userId as any)._id 
      : post.userId;
    // Convert both to strings for comparison to handle ObjectId vs string
    return postUserId && postUserId.toString() === currentUserId.toString();
  })() : false;

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

  const handleAddComment = async () => {
    if (!newComment.trim() || !postId) {
      Alert.alert("Error", "Please enter a comment");
      return;
    }

    try {
      setCommentLoading(true);
      const response = await commentService.createComment(postId, newComment.trim());
      
      if (response.success && response.comment) {
        const newCommentData: Comment = {
          ...response.comment,
          id: response.comment._id,
          createdAt: response.comment.createdAt ? new Date(response.comment.createdAt).toLocaleString() : "Just now",
        };
        setComments([newCommentData, ...comments]);
        setNewComment("");
        
        // Refresh posts to update comment count in PostCard
        await refreshPosts();
        
        // Reload the current post to get updated comment count
        await loadPost();
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to add comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !postId) return;

    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost(postId);
            router.back();
            Alert.alert("Success", "Post deleted successfully");
            await refreshPosts();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete post");
          }
        },
      },
    ]);
  };

  const handlePreviewImagePress = () => {
    // If PDF exists, open PDF; otherwise show full-screen image
    if (post?.bookType === "Manual" && (post?.pdfUrl || post?.fileUrl)) {
      handlePdfPress();
    } else if (previewImageUrl) {
      setFullImageVisible(true);
    }
  };

  const handlePdfPress = async () => {
    const pdfUrl = post?.pdfUrl || post?.fileUrl;
    if (pdfUrl) {
      try {
        await WebBrowser.openBrowserAsync(pdfUrl);
      } catch (error: any) {
        console.error("Error opening PDF:", error);
        Alert.alert("Error", "Failed to open PDF. Please try again.");
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={DarkTheme.colors.primary} />
        <Text style={styles.loadingText}>Loading post...</Text>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Post not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          disabled={false}
        />
      </SafeAreaView>
    );
  }

  const previewImageUrl = post.previewImage;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[DarkTheme.colors.surface, DarkTheme.colors.background]}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={28} color={DarkTheme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Details</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyboardShouldPersistTaps="handled"
        >
        {previewImageUrl && post.bookType !== "Referred Link" && (
          <TouchableOpacity onPress={handlePreviewImagePress} activeOpacity={0.9} style={styles.previewImageContainer}>
            <Image 
              source={{ uri: previewImageUrl }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
            {/* Show "Tap to View PDF" label if PDF exists */}
            {post.bookType === "Manual" && (post.pdfUrl || post.fileUrl) && (
              <View style={styles.pdfLabelOverlay}>
                <MaterialIcons
                  name="picture-as-pdf"
                  size={18}
                  color={DarkTheme.colors.white}
                />
                <Text style={styles.pdfLabelText}>Tap to View PDF</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* PDF Viewer for Manual posts without preview image */}
        {post.bookType === "Manual" && (post.pdfUrl || post.fileUrl) && !previewImageUrl && (
          <TouchableOpacity
            style={styles.pdfViewer}
            onPress={handlePdfPress}
            activeOpacity={0.8}
          >
            <View style={styles.pdfViewerContent}>
              <MaterialIcons
                name="picture-as-pdf"
                size={64}
                color={DarkTheme.colors.primary}
              />
              <Text style={styles.pdfViewerText}>Tap to view PDF</Text>
              <Text style={styles.pdfViewerSubtext}>{post.title}</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{post.title}</Text>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: getBookTypeColor(post.bookType) },
              ]}
            >
              <Text style={styles.typeText}>{post.bookType}</Text>
            </View>
          </View>

          <Text style={styles.description}>{post.description}</Text>

          <View style={styles.authorSection}>
            <TouchableOpacity
              onPress={() => {
                const postUserId = typeof post.userId === "object" && post.userId !== null
                  ? (post.userId as any)._id
                  : post.userId;
                if (postUserId) {
                  router.push(`/(routes)/profile?userId=${postUserId}` as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Avatar
                uri={post.userAvatar}
                name={post.userName || "Unknown"}
                size={50}
              />
            </TouchableOpacity>
            <View style={styles.authorInfo}>
              <Text style={styles.authorLabel}>Posted by</Text>
              <TouchableOpacity
                onPress={() => {
                  const postUserId = typeof post.userId === "object" && post.userId !== null
                    ? (post.userId as any)._id
                    : post.userId;
                  if (postUserId) {
                    router.push(`/(routes)/profile?userId=${postUserId}` as any);
                  }
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.authorName}>{post.userName || "Unknown"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.commentsSection}>
          <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <CommentItem key={comment._id || comment.id} comment={comment} />
            ))
          ) : (
            <View style={styles.emptyComments}>
              <MaterialIcons
                name="comment"
                size={48}
                color={DarkTheme.colors.disabled}
              />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>
                Be the first to comment!
              </Text>
            </View>
          )}
        </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={DarkTheme.colors.disabled}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              returnKeyType="default"
            />
            <TouchableOpacity
              onPress={handleAddComment}
              style={styles.sendButton}
              disabled={!newComment.trim() || commentLoading}
            >
              {commentLoading ? (
                <ActivityIndicator size="small" color={DarkTheme.colors.primary} />
              ) : (
                <MaterialIcons
                  name="send"
                  size={24}
                  color={
                    newComment.trim()
                      ? DarkTheme.colors.primary
                      : DarkTheme.colors.disabled
                  }
                />
              )}
            </TouchableOpacity>
          </View>
          {isOwner && (
            <Button
              title="Delete Post"
              onPress={handleDeletePost}
              disabled={false}
              customStyle={styles.deleteButton}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DarkTheme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
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
  backButton: {
    padding: responsiveScreenWidth(1),
  },
  headerTitle: {
    fontSize: responsiveFontSize(2.3),
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: responsiveScreenWidth(9),
  },
  scrollContent: {
    paddingBottom: responsiveScreenHeight(2),
    flexGrow: 1,
  },
  previewImageContainer: {
    position: "relative",
    width: "100%",
  },
  previewImage: {
    width: "100%",
    height: responsiveScreenHeight(35),
    backgroundColor: DarkTheme.colors.border,
    resizeMode: "cover",
  },
  pdfLabelOverlay: {
    position: "absolute",
    bottom: responsiveScreenHeight(2),
    right: responsiveScreenWidth(4),
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: responsiveScreenWidth(3.5),
    paddingVertical: responsiveScreenHeight(1),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    maxWidth: "90%",
  },
  pdfLabelText: {
    fontSize: responsiveFontSize(1.5),
    fontWeight: "600",
    color: DarkTheme.colors.white,
    marginLeft: responsiveScreenWidth(2),
    flexShrink: 1,
  },
  content: {
    padding: responsiveScreenWidth(4),
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  title: {
    fontSize: responsiveFontSize(2.8),
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    flex: 1,
    marginRight: 12,
    minWidth: 0, // Allow text to shrink
  },
  typeBadge: {
    paddingHorizontal: responsiveScreenWidth(3),
    paddingVertical: responsiveScreenHeight(0.7),
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  typeText: {
    fontSize: responsiveFontSize(1.4),
    fontWeight: "700",
    color: "#fff",
  },
  description: {
    fontSize: responsiveFontSize(1.9),
    color: DarkTheme.colors.subtext,
    lineHeight: responsiveFontSize(2.8),
    marginBottom: responsiveScreenHeight(2.5),
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: responsiveScreenHeight(2),
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.border,
  },
  authorInfo: {
    marginLeft: responsiveScreenWidth(3),
    flex: 1,
  },
  authorLabel: {
    fontSize: responsiveFontSize(1.4),
    color: DarkTheme.colors.subtext,
    marginBottom: responsiveScreenHeight(0.5),
  },
  authorName: {
    fontSize: responsiveFontSize(1.9),
    fontWeight: "600",
    color: DarkTheme.colors.text,
  },
  commentsSection: {
    padding: responsiveScreenWidth(4),
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.border,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(2.3),
    fontWeight: "bold",
    color: DarkTheme.colors.text,
    marginBottom: responsiveScreenHeight(2),
  },
  emptyComments: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: "600",
    color: DarkTheme.colors.text,
    marginTop: 16,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: DarkTheme.colors.subtext,
    marginTop: 8,
  },
  footer: {
    backgroundColor: DarkTheme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: DarkTheme.colors.border,
    padding: responsiveScreenWidth(4),
    paddingBottom: Platform.OS === "ios" ? responsiveScreenHeight(2) : responsiveScreenHeight(1),
    paddingTop: responsiveScreenHeight(1),
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DarkTheme.colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    paddingHorizontal: responsiveScreenWidth(4),
    marginBottom: responsiveScreenHeight(1.5),
    minHeight: responsiveScreenHeight(6),
  },
  commentInput: {
    flex: 1,
    fontSize: responsiveFontSize(1.7),
    color: DarkTheme.colors.text,
    paddingVertical: responsiveScreenHeight(1.5),
    maxHeight: responsiveScreenHeight(12),
    minWidth: 0, // Prevent horizontal scroll
  },
  sendButton: {
    padding: 8,
  },
  pdfViewer: {
    width: "100%",
    minHeight: responsiveScreenHeight(30),
    backgroundColor: DarkTheme.colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DarkTheme.colors.border,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: responsiveScreenHeight(4),
  },
  pdfViewerContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: responsiveScreenWidth(4),
  },
  pdfViewerText: {
    fontSize: responsiveFontSize(2.1),
    fontWeight: "600",
    color: DarkTheme.colors.primary,
    marginTop: responsiveScreenHeight(1.5),
    textAlign: "center",
  },
  pdfViewerSubtext: {
    fontSize: responsiveFontSize(1.7),
    color: DarkTheme.colors.subtext,
    marginTop: responsiveScreenHeight(1),
    textAlign: "center",
    paddingHorizontal: responsiveScreenWidth(5),
  },
  fullImageModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  fullImageCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1000,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: DarkTheme.colors.danger,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: DarkTheme.colors.subtext,
  },
});

export default PostDetailScreen;
