import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import DarkTheme from "@/styles/theme";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  showInitials?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = "User",
  size = 50,
  showInitials = true,
}) => {
  const [imageError, setImageError] = useState(false);
  
  const getInitials = (fullName: string) => {
    return fullName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if URI is valid
  const isValidUri = uri && uri.trim() !== "" && !imageError;

  // Log for debugging
  React.useEffect(() => {
    if (uri) {
      console.log("Avatar URI:", uri);
    }
  }, [uri]);

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {isValidUri ? (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: "LGF5]+Yk^6#M@-5c,1J5@[or[Q6." }}
          onError={(error) => {
            console.log("Avatar image failed to load:", uri, error);
            setImageError(true);
          }}
          onLoad={() => {
            console.log("Avatar image loaded successfully:", uri);
            setImageError(false);
          }}
        />
      ) : showInitials && name ? (
        <Text
          style={[
            styles.initials,
            {
              fontSize: size * 0.4,
            },
          ]}
        >
          {getInitials(name)}
        </Text>
      ) : (
        <MaterialIcons name="person" size={size * 0.6} color={DarkTheme.colors.text} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: DarkTheme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: DarkTheme.colors.primary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: DarkTheme.colors.text,
    fontWeight: "bold",
  },
});

export default Avatar;

