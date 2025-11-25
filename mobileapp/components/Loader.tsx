import React from "react";
import AnimatedLoader from "react-native-animated-loader";

export default function Loader() {
  return (
    <AnimatedLoader
      visible={true}
      source={require("@/assets/animation/loading.json")}
      animationStyle={{ width: 400, height: 400 }}
    />
  );
}
