import { Stack, SplashScreen } from "expo-router";
import './global.css'
import { useFonts } from "expo-font";
import { useEffect } from "react";
import * as Sentry from '@sentry/react-native';
import useAuthStore from "@/store/auth.store";


Sentry.init({
  dsn: 'https://201141c858598552a795e3e5bff7cf38@o4510455462363136.ingest.de.sentry.io/4510455488839760',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

// @ts-ignore
export default Sentry.wrap(function RootLayout() {
    const {isLoading , fetchAuthenticatedUser}  = useAuthStore();
    const [fontsLoaded, error] = useFonts({
        QuicksandRegular: require("../assets/fonts/Quicksand-Regular.ttf"),
        QuicksandMedium: require("../assets/fonts/Quicksand-Medium.ttf"),
        QuicksandSemiBold: require("../assets/fonts/Quicksand-SemiBold.ttf"),
        QuicksandBold: require("../assets/fonts/Quicksand-Bold.ttf"),
        QuicksandLight: require("../assets/fonts/Quicksand-Light.ttf"),
    });



    useEffect(() => {
        if (error) throw error;
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded, error]);


    useEffect(() => {
      fetchAuthenticatedUser();
    }, []);

    if(!fontsLoaded || isLoading ) return null;

    return <Stack
        initialRouteName="(tabs)"
        screenOptions={{ headerShown: false }} />;
});