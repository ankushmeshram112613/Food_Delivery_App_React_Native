import {View, Text, Alert,} from 'react-native'
import React, {use} from 'react'
import {Link, router,} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import {useState} from "react";
import {creatUser} from "@/lib/appwrite";
import {SignIn} from "@/lib/appwrite";


const SignUp = () => {

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [form, setForm] = useState({name: '', email: '', password: ''})

    const submi = async () => {
        const {name, email, password} = form
        
        if (!name || !email || !password) {
            return Alert.alert('Error', 'Please fill all the fields')
        }

        setIsSubmitting(true)

        try {
            // 1. Create the user account
            await creatUser({
                email,
                password,
                name
            });

            // 2. Sign in the user after successful registration
            await SignIn({email, password});
            
            // 3. Navigate to home on success
            router.replace('/');
            
        } catch (error) {
            console.error('Sign up error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during sign up';
            Alert.alert('Error', errorMessage);
            
            // If user already exists, navigate to sign in
            if (errorMessage.includes('already exists')) {
                Alert.alert(
                    'Account Exists',
                    'An account with this email already exists. Would you like to sign in instead?',
                    [
                        {
                            text: 'Sign In',
                            onPress: () => router.replace('/sign-in')
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    }
    return (
        <View className=" gap-10 bg-white rounded-lg p-5 mt-5">

            <CustomInput
                label="Full Name"
                placeholder="Enter your Full Name"
                value={form.name}
                onChangeText={(text) => setForm(prev => ({...prev, name: text}))}
            />

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
                title="Sign Up"
                onPress={submi}
                isLoading={isSubmitting}
            />

            <View className="flex justify-center mt-5 flex-row gap-2">
                <Text className="base-regular text-gray-100">
                   Already have an account?
                </Text>
                <Link href='/sign-in' className='text-primary base-semibold'>Sign In</Link>
            </View>


        </View>
    )
}
export default SignUp
