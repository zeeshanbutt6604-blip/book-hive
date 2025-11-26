import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  responsiveFontSize,
  responsiveScreenHeight,
  responsiveScreenWidth,
} from "react-native-responsive-dimensions";
import Avatar from "./Avatar";
import DarkTheme from "@/styles/theme";
import { useRouter } from "expo-router";
import { userService } from "@/services/userService";

export interface Comment {
  id?: string;
  _id?: string;
  userId: string | {
    _id: string;
    name: string;
    email: string;
    profile_picture?: string;
  };
  userName?: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
}

interface CommentItemProps {
  comment: Comment;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment }) => {
  const router = useRouter();
  
  // Handle null/undefined userId
  let userIdObj: any;
  if (comment.userId && typeof comment.userId === "object" && comment.userId !== null) {
    userIdObj = comment.userId;
  } else {
    userIdObj = null;
  }
  
  const userId = userIdObj && userIdObj._id ? userIdObj._id : (typeof comment.userId === "string" ? comment.userId : null);
  const userName = (userIdObj && typeof userIdObj === "object" && userIdObj.name) 
    ? userIdObj.name 
    : (comment.userName || "Unknown");
  const profilePicture = (userIdObj && typeof userIdObj === "object" && userIdObj.profile_picture)
    ? userIdObj.profile_picture
    : comment.userAvatar;
  const userAvatar = profilePicture ? userService.getFileUrl(profilePicture) : undefined;

  const handleAvatarPress = () => {
    if (!userId || userId === "null" || userId === "undefined") {
      return; // Don't navigate if userId is invalid
    }
    router.push(`/(routes)/profile?userId=${userId}` as any);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.7}>
        <Avatar uri={userAvatar} name={userName} size={40} />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.timeAgo}>{comment.createdAt}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: responsiveScreenHeight(1.5),
    paddingHorizontal: responsiveScreenWidth(1),
    borderBottomWidth: 1,
    borderBottomColor: DarkTheme.colors.border,
  },
  content: {
    flex: 1,
    marginLeft: responsiveScreenWidth(3),
    minWidth: 0, // Prevent horizontal scroll
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveScreenHeight(0.5),
    flexWrap: "wrap",
  },
  userName: {
    fontSize: responsiveFontSize(1.7),
    fontWeight: "600",
    color: DarkTheme.colors.text,
    marginRight: responsiveScreenWidth(2),
    flexShrink: 1,
  },
  timeAgo: {
    fontSize: responsiveFontSize(1.4),
    color: DarkTheme.colors.subtext,
    flexShrink: 0,
  },
  commentText: {
    fontSize: responsiveFontSize(1.7),
    color: DarkTheme.colors.subtext,
    lineHeight: responsiveFontSize(2.4),
    flexWrap: "wrap",
  },
});

export default CommentItem;
