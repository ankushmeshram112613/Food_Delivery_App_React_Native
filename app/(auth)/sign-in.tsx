import {View, Text, Alert,} from 'react-native'
import React, {use} from 'react'
import {Link, router,} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import {useState} from "react";
import {signIn ,creatUser} from "@/lib/appwrite";
import * as Sentry from '@sentry/react-native'


const SignIn = () => {

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form, setForm] = useState({email: '', password: ''})

    const submi = async () => {

        const {email,password} = form ;

        if (!email || !password) return  Alert.alert('Error', 'Please fill all the fields')

        setIsSubmitting(true)

        try {
           // Call Appwrite Sign In Function

            await signIn({email,password})


            // Alert.alert('Succese','User Signed In Successfully')
            router.replace('/')
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            Alert.alert('Error', errorMessage)
                     Sentry.captureException(error)
        }finally {
            setIsSubmitting(false)
        }

    }
    return (
        <View className=" gap-10 bg-white rounded-lg p-5 mt-5">

            <CustomInput
                label="Email"
                placeholder="Enter your email"
                value={form.email}
                onChangeText={(text) => setForm(prev => ({...prev, email: text}))}
                secureTextEntry={false}
                keyboardType="email-address"
            />

            <CustomInput
                label="Password"
                placeholder="Enter your Password"
                value={form.password}
                onChangeText={(text) => setForm(prev => ({...prev, password: text}))}
                secureTextEntry={true}
            />

            <CustomButton
                title="Sign In"
                onPress={submi}
                isLoading={isSubmitting}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">
                    Don&apos;t have an account ?
                </Text>
                <Link href='/sign-up' className='text-primary base-semibold'>Sign Up</Link>
            </View>


        </View>
    )
}
export default SignIn
