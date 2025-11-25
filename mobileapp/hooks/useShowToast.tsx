import React from "react";
import { useToast } from "react-native-toast-notifications";
import Icon from "react-native-vector-icons/Feather";

const useShowToast = () => {
  const toast = useToast();

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => {
    const getToastStyle = (type: string) => {
      switch (type) {
        case "success":
          return { backgroundColor: "#12C4B1", icon: "check-circle" };
        case "error":
          return { backgroundColor: "#FF6B6B", icon: "alert-circle" };
        case "warning":
          return { backgroundColor: "#FFB020", icon: "alert-triangle" };
        default:
          return { backgroundColor: "#333", icon: "info" };
      }
    };

    const { backgroundColor, icon } = getToastStyle(type);

    toast.show(message, {
      placement: "top", // Keep it at the top
      duration: 4000,
      animationType: "slide-in",
      style: {
        backgroundColor,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginTop: 80,
      },
      icon: <Icon name={icon} size={20} color="#fff" />,
      textStyle: { color: "#fff", fontSize: 16 },
    });
  };

  return showToast;
};

export default useShowToast;
