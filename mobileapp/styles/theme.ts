import { MD3DarkTheme as DefaultDarkTheme } from "react-native-paper";

const DarkTheme = {
  ...DefaultDarkTheme,
  colors: {
    ...DefaultDarkTheme.colors,
    primary: "#9D16D2",
    primary2: "#b22ee6",
    secondary: "#EAB43F",
    accent: "#FFD700",
    text: "#FFFFFF",
    black: "#000000",
    white: "#FFFFFF",
    danger: "#ff0000",
    grey: "#C6C7CC",
    subtext: "#AAAAAA",
    borderColor: "#3A3A3A",
    background: "#121212",
    surface: "#1E1E1E",
    border: "#333333",
    disabled: "#666666",
    gradient: ["#9D16D2", "#FFD700"],
    transparent: "transparent",
    overlay: "rgba(0, 0, 0, 0.5)",
    overlay2: "rgba(198, 199, 204, 0.2)",
  },
};

export default DarkTheme;
