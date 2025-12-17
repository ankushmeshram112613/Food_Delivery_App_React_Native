import { Stack, SplashScreen, Redirect } from "expo-router";
import './global.css'
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";
import { View } from 'react-native';

Sentry.init({
  dsn: 'https://201141c858598552a795e3e5bff7cf38@o4510455462363136.ingest.de.sentry.io/4510455488839760',
  sendDefaultPii: true,
  enableLogs: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],
});

function RootLayout() {
  const { isAuthenticated, isLoading, fetchAuthenticatedUser } = useAuthStore();
  const [fontsLoaded, error] = useFonts({
    QuicksandRegular: require("../assets/fonts/Quicksand-Regular.ttf"),
    QuicksandMedium: require("../assets/fonts/Quicksand-Medium.ttf"),
    QuicksandSemiBold: require("../assets/fonts/Quicksand-SemiBold.ttf"),
    QuicksandBold: require("../assets/fonts/Quicksand-Bold.ttf"),
    QuicksandLight: require("../assets/fonts/Quicksand-Light.ttf"),
  });

  // Initialize auth state
  useEffect(() => {
    fetchAuthenticatedUser();
  }, []);

  // Handle font loading and errors
  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  // Show loading state while checking auth and loading fonts
  if (!fontsLoaded || isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(auth)" 
        options={{ headerShown: false }}
        redirect={isAuthenticated}
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }}
        redirect={!isAuthenticated}
      />
    </Stack>
  );
}

export default Sentry.wrap(RootLayout);