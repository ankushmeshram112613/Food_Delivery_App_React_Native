import { Stack, SplashScreen } from "expo-router";
import './global.css'
import { useFonts } from "expo-font";
import { useEffect } from "react";

// @ts-ignore
export default function RootLayout() {
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

    return <Stack
        initialRouteName="(tabs)"
        screenOptions={{ headerShown: false }} />;
}