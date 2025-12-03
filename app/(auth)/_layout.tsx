import {View, KeyboardAvoidingView, ScrollView, Platform,ImageBackground, Dimensions , Image} from 'react-native'
import React from 'react'
import {Slot, Redirect} from "expo-router";
import {images} from "@/constants";
import useAuthStore from "@/store/auth.store";


export default function AuthLayout() {

    const {isAuthenticated} = useAuthStore() ;

    if(isAuthenticated) return  <Redirect href={"/"}/>

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <ScrollView 
                className="bg-white flex-1" 
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ flexGrow: 1 }}
            >
                <View 
                    className="w-full relative" 
                    style={{
                        height: Dimensions.get('screen').height / 2.25
                    }}
                >
                    <ImageBackground
                        source={images.loginGraphic}
                        className="size-full rounded-b-lg"
                        resizeMode="stretch"
                    />

                    <Image source={images.logo} className="self-center size-48 absolute -bottom-16  z-10"/>
                </View>



                    <Slot />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
