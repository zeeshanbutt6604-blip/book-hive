import NetInfo from "@react-native-community/netinfo";

export const checkInternetConnection = (callback: any) => {
  NetInfo.fetch().then((state) => {
    callback(state.isConnected);
  });

  const unsubscribe = NetInfo.addEventListener((state) => {
    callback(state.isConnected);
  });

  return unsubscribe;
};
