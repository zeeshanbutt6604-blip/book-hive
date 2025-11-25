import React, { Suspense, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { Persistor } from "@/stores/rootStore";
import NoInternet from "@/screens/NoInternet";
import Loader from "@/components/Loader";
import { PostsProvider } from "@/contexts/PostsContext";

import { checkInternetConnection } from "@/utils/checkInternetConnection.util";

import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView, StyleSheet } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Stack } from "expo-router";
import { ToastProvider } from "react-native-toast-notifications";
import { Provider as PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";
import DarkTheme from "../styles/theme";
import "react-native-reanimated";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  const [isInternetConnected, setIsInternetConnected] = useState(true);
  useEffect(() => {
    const unsubscribe = checkInternetConnection(setIsInternetConnected);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      <Provider store={store}>
        <PersistGate loading={<Loader />} persistor={Persistor}>
          <Suspense fallback={<Loader />}>
            <PaperProvider theme={DarkTheme}>
              <PostsProvider>
                <StatusBar
                  style="light"
                  backgroundColor={DarkTheme.colors.background}
                />
                {isInternetConnected ? <RootLayoutNav /> : <NoInternet />}
              </PostsProvider>
            </PaperProvider>
          </Suspense>
        </PersistGate>
      </Provider>
    </>
  );
}

function RootLayoutNav() {
  return (
    <ToastProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <Stack
            screenOptions={{ headerShown: false }}
            initialRouteName="(routes)/splash"
          >
            <Stack.Screen name="(routes)/splash" />
            <Stack.Screen name="(routes)/onboarding" />
            <Stack.Screen name="(routes)/signin" />
            <Stack.Screen name="(routes)/signup" />
            <Stack.Screen name="(routes)/postdetail" />
            <Stack.Screen name="(routes)/profile" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaView>
      </GestureHandlerRootView>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: DarkTheme.colors.background,
  },
});
