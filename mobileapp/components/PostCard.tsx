import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from "react-native-responsive-dimensions";
import Avatar from "./Avatar";
import DarkTheme from "@/styles/theme";

const { width } = Dimensions.get("window");

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  bookType: "Manual" | "Donate" | "Referred Link";
  previewImage?: string;
  pdfUrl?: string;
  pdfName?: string;
  fileUrl?: string; // For API compatibility
  referredLink?: string;
  commentCount: number;
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  onPress: () => void;
  showDelete?: boolean;
  onDelete?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPress,
  showDelete = false,
  onDelete,
}) => {
  const [imageError, setImageError] = useState(false);
  const [fullImageVisible, setFullImageVisible] = useState(false);
  
  // Validate image URL
  const isValidImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
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

  const handlePreviewImagePress = (e: any) => {
    e.stopPropagation();
    // If PDF exists, open PDF; otherwise show full-screen image
    if (post.bookType === "Manual" && (post.pdfUrl || post.fileUrl)) {
      handlePdfPress(e);
    } else if (post.previewImage) {
      setFullImageVisible(true);
    }
  };

  const handlePdfPress = async (e: any) => {
    e.stopPropagation();
    const pdfUrl = post.pdfUrl || post.fileUrl;
    if (pdfUrl) {
      try {
        await WebBrowser.openBrowserAsync(pdfUrl);
      } catch (error: any) {
        console.error("Error opening PDF:", error);
      }
    }
  };

  const handleLinkPress = async (e: any) => {
    e.stopPropagation();
    if (post.referredLink) {
      try {
        const canOpen = await Linking.canOpenURL(post.referredLink);
        if (canOpen) {
          await Linking.openURL(post.referredLink);
        } else {
          Alert.alert("Error", "Cannot open this link");
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to open link");
      }
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Avatar
            uri={post.userAvatar}
            name={post.userName}
            size={45}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.userName}</Text>
            <Text style={styles.timeAgo}>{post.createdAt}</Text>
          </View>
        </View>
        {showDelete && onDelete && (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={styles.deleteButton}
          >
            <MaterialIcons
              name="delete-outline"
              size={24}
              color={DarkTheme.colors.danger}
            />
          </TouchableOpacity>
        )}
      </View>

      {post.previewImage && post.bookType !== "Referred Link" && (
        <TouchableOpacity onPress={handlePreviewImagePress} activeOpacity={0.9} style={styles.previewImageContainer}>
          <Image source={{ uri: post.previewImage }} style={styles.previewImage} />
          {/* Show "Tap to View PDF" label if PDF exists */}
          {post.bookType === "Manual" && (post.pdfUrl || post.fileUrl) && (
            <View style={styles.pdfLabelOverlay}>
              <MaterialIcons
                name="picture-as-pdf"
                size={16}
                color={DarkTheme.colors.white}
              />
              <Text style={styles.pdfLabelText}>Tap to View PDF</Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* PDF Viewer for Manual posts without preview image */}
      {post.bookType === "Manual" && (post.pdfUrl || post.fileUrl) && !post.previewImage && (
        <TouchableOpacity
          style={styles.pdfViewer}
          onPress={handlePdfPress}
          activeOpacity={0.8}
        >
          <View style={styles.pdfViewerContent}>
            <MaterialIcons
              name="picture-as-pdf"
              size={48}
              color={DarkTheme.colors.primary}
            />
            <Text style={styles.pdfViewerText}>Tap to view PDF</Text>
            <Text style={styles.pdfViewerSubtext}>{post.title}</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {post.title}
          </Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: getBookTypeColor(post.bookType) },
            ]}
          >
            <Text style={styles.typeText}>{post.bookType}</Text>
          </View>
        </View>

        <Text style={styles.description} numberOfLines={3}>
          {post.description}
        </Text>

        {post.referredLink && (
          <TouchableOpacity
            style={styles.linkContainer}
            onPress={handleLinkPress}
            activeOpacity={0.7}
          >
            {/* Preview image is REQUIRED for Referred Link posts */}
            {post.bookType === "Referred Link" && post.previewImage && isValidImageUrl(post.previewImage) && !imageError ? (
              <ExpoImage 
                source={{ uri: post.previewImage }} 
                style={styles.linkPreviewImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                placeholderContentFit="cover"
                onError={(error) => {
                  console.log("❌ Image failed to load:", post.previewImage);
                  console.log("Error details:", error);
                  setImageError(true);
                }}
                onLoad={() => {
                  console.log("✅ Image loaded successfully:", post.previewImage);
                  setImageError(false);
                }}
                onLoadStart={() => {
                  console.log("🔄 Loading image:", post.previewImage);
                }}
              />
            ) : post.bookType === "Referred Link" ? (
              // Fallback if image is missing or failed to load
              <View style={styles.linkPreviewImagePlaceholder}>
                <MaterialIcons
                  name="link"
                  size={24}
                  color={DarkTheme.colors.primary}
                />
                <Text style={styles.linkPreviewPlaceholderText}>Link Preview</Text>
              </View>
            ) : null}
            <View style={[styles.linkContent, !post.previewImage && styles.linkContentFull]}>
              <View style={styles.linkHeader}>
                <MaterialIcons
                  name="link"
                  size={16}
                  color={DarkTheme.colors.primary}
                />
                <Text style={styles.linkText} numberOfLines={1}>
                  {post.referredLink}
                </Text>
              </View>
              <Text style={styles.linkOpenText}>Tap to open</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <View style={styles.commentSection}>
            <MaterialIcons
              name="comment" as any
              size={20}
              color={DarkTheme.colors.subtext}
            />
            <Text style={styles.commentCount}>{post.commentCount} comments</Text>
          </View>
        </View>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullImageVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullImageVisible(false)}
      >
        <View style={styles.fullImageModal}>
          <TouchableOpacity
            style={styles.fullImageCloseButton}
            onPress={() => setFullImageVisible(false)}
          >
            <MaterialIcons
              name="close"
              size={32}
              color={DarkTheme.colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fullImageContainer}
            activeOpacity={1}
            onPress={() => setFullImageVisible(false)}
          >
            <ExpoImage
              source={{ uri: post.previewImage }}
              style={styles.fullImage}
              contentFit="contain"
              transition={200}
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DarkTheme.colors.surface,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveScreenWidth(3),
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0, // Prevent horizontal scroll
  },
  userDetails: {
    marginLeft: responsiveScreenWidth(3),
    flex: 1,
    minWidth: 0, // Prevent horizontal scroll
  },
  userName: {
    fontSize: responsiveFontSize(1.9),
    fontWeight: "600",
    color: DarkTheme.colors.text,
  },
  timeAgo: {
    fontSize: responsiveFontSize(1.4),
    color: DarkTheme.colors.subtext,
    marginTop: responsiveScreenHeight(0.2),
  },
  deleteButton: {
    padding: 4,
  },
  previewImageContainer: {
    position: "relative",
    width: "100%",
  },
  previewImage: {
    width: "100%",
    height: 200,
    backgroundColor: DarkTheme.colors.border,
  },
  pdfLabelOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  pdfLabelText: {
    fontSize: 12,
    fontWeight: "600",
    color: DarkTheme.colors.white,
    marginLeft: 6,
  },
  content: {
    padding: responsiveScreenWidth(3),
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: responsiveScreenHeight(1),
    flexWrap: "wrap",
  },
  title: {
    fontSize: responsiveFontSize(2.1),
    fontWeight: "700",
    color: DarkTheme.colors.text,
    flex: 1,
    marginRight: responsiveScreenWidth(2),
    minWidth: 0, // Allow text to shrink
  },
  typeBadge: {
    paddingHorizontal: responsiveScreenWidth(2.5),
    paddingVertical: responsiveScreenHeight(0.5),
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: responsiveScreenHeight(0.3),
  },
  typeText: {
    fontSize: responsiveFontSize(1.3),
    fontWeight: "600",
    color: "#fff",
  },
  description: {
    fontSize: responsiveFontSize(1.7),
    color: DarkTheme.colors.subtext,
    lineHeight: responsiveFontSize(2.4),
    marginBottom: responsiveScreenHeight(1.5),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentCount: {
    fontSize: responsiveFontSize(1.5),
    color: DarkTheme.colors.subtext,
    marginLeft: responsiveScreenWidth(1.5),
  },
  pdfViewer: {
    width: "100%",
    height: 200,
    backgroundColor: DarkTheme.colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DarkTheme.colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  pdfViewerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  pdfViewerText: {
    fontSize: 16,
    fontWeight: "600",
    color: DarkTheme.colors.primary,
    marginTop: 8,
  },
  pdfViewerSubtext: {
    fontSize: 12,
    color: DarkTheme.colors.subtext,
    marginTop: 4,
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
  linkContainer: {
    flexDirection: "row",
    backgroundColor: DarkTheme.colors.surface,
    borderWidth: 1,
    borderColor: DarkTheme.colors.border,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  linkPreviewImage: {
    width: 120,
    height: 80,
    backgroundColor: DarkTheme.colors.border || "#E0E0E0",
    minWidth: 120,
    minHeight: 80,
  },
  linkPreviewImagePlaceholder: {
    width: 120,
    height: 80,
    backgroundColor: DarkTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: DarkTheme.colors.border,
  },
  linkPreviewPlaceholderText: {
    fontSize: 10,
    color: DarkTheme.colors.subtext,
    marginTop: 4,
    textAlign: "center",
  },
  linkContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  linkContentFull: {
    padding: 16,
  },
  linkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  linkText: {
    fontSize: 12,
    color: DarkTheme.colors.primary,
    marginLeft: 6,
    flex: 1,
  },
  linkOpenText: {
    fontSize: 11,
    color: DarkTheme.colors.subtext,
    fontStyle: "italic",
  },
});

export default PostCard;

