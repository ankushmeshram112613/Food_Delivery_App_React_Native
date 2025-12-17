import React, { useEffect, useState } from 'react'
import {
    ScrollView,
    View,
    Text,
    Image,
    TouchableOpacity,
    ImageSourcePropType,
    Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import CustomHeader from '@/components/CustomHeader'
import { images } from '@/constants'
import useAuthStore from '@/store/auth.store'
import { router } from 'expo-router'
import { signOut, updateUser, uploadFile, getFilePreview } from '@/lib/appwrite'
import useImagePicker from '@/lib/useImagePicker'

type ProfileInfoRowProps = {
    icon: ImageSourcePropType
    label: string
    value: string
}

const ProfileInfoRow = ({ icon, label, value }: ProfileInfoRowProps) => (
    <View className="flex-row items-start gap-4">
        <View className="size-11 rounded-xl bg-[#FFF3E0] flex-center">
            <Image source={icon} className="size-5" resizeMode="contain" />
        </View>
        <View className="flex-1">
            <Text className="paragraph-medium text-gray-400">{label}</Text>
            <Text className="paragraph-semibold text-dark-100 mt-1">{value}</Text>
        </View>
    </View>
)

const Profile = () => {
    const { user, isLoading, fetchAuthenticatedUser, setIsAuthenticated, setUser } = useAuthStore()
    const { pickImage, isPicking } = useImagePicker()
    const [isUploading, setIsUploading] = useState(false)

    useEffect(() => {
        if (!user) {
            fetchAuthenticatedUser().catch(() => null)
        }
    }, [user, fetchAuthenticatedUser])

    const handleLogout = async () => {
        try {
            await signOut()
            setIsAuthenticated(false)
            setUser(null)
            router.replace('/sign-in')
        } catch (error) {
            Alert.alert('Error', 'Failed to logout. Please try again.')
        }
    }

    const handleEditProfile = () => {
        Alert.alert('Edit Profile', 'This feature is not yet implemented.')
    }
    const handleImagePick = async () => {
        const result = await pickImage()

        if (result) {
            setIsUploading(true)
            try {
                const uploadedFile = await uploadFile(result.uri, result.fileName!, result.mimeType!)
                const fileUrl = await getFilePreview(uploadedFile.$id)

                await updateUser(user!.$id, { avatar: fileUrl })
                await fetchAuthenticatedUser()

                Alert.alert('Success', 'Profile picture updated successfully.')
            } catch (error) {
                console.error('Error uploading image:', error)
                Alert.alert('Error', 'Failed to upload image. Please try again.')
            } finally {
                setIsUploading(false)
            }
        }
    }

    const prefs = user?.prefs ?? {}

    const avatarSource: ImageSourcePropType = user?.avatar
        ? { uri: user.avatar }
        : images.avatar

    const profileFields = [
        {
            icon: images.person,
            label: 'Full Name',
            value: user?.name ?? 'Guest User',
        },
        {
            icon: images.envelope,
            label: 'Email',
            value: user?.email ?? 'Add your email',
        },
        {
            icon: images.phone,
            label: 'Phone number',
            value: prefs.phoneNumber ?? '+1 555 123 4567',
        },
        {
            icon: images.location,
            label: 'Address 1 - (Home)',
            value: prefs.addressHome ?? 'Add your home address',
        },
        {
            icon: images.location,
            label: 'Address 2 - (Work)',
            value: prefs.addressWork ?? 'Add your work address',
        },
    ]

    return (
        <SafeAreaView className="bg-[#FDF8F3] h-full">
            <ScrollView className="px-5 pt-5" contentContainerStyle={{ paddingBottom: 48 }}>
                <CustomHeader title="Profile" />

                <View className="items-center mt-8">
                    <TouchableOpacity onPress={handleImagePick} disabled={isPicking || isUploading}>
                        <View className="w-28 h-28 rounded-full bg-[#FFE1C0] flex-center">
                            <Image
                                source={avatarSource}
                                className="w-24 h-24 rounded-full"
                                resizeMode="cover"
                            />
                        </View>
                    </TouchableOpacity>
                    <Text className="h3-bold text-dark-100 mt-4">{user?.name ?? 'Guest User'}</Text>
                    <Text className="paragraph-regular text-gray-500">
                        {user?.email ?? 'Add your email'}
                    </Text>
                </View>

                <View className="mt-10 rounded-3xl bg-white px-6 py-6 shadow-lg shadow-black/5 gap-6">
                    {profileFields.map((field) => (
                        <ProfileInfoRow
                            key={field.label}
                            icon={field.icon}
                            label={field.label}
                            value={field.value}
                        />
                    ))}
                </View>

                <View className="mt-8 gap-4">
                    <TouchableOpacity
                        onPress={handleEditProfile}
                        className="rounded-full border border-[#FF9C01] bg-[#FFEAD6] py-4"
                    >
                        <Text className="text-center paragraph-semibold text-[#C26A00]">
                            Edit Profile
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleLogout}
                        className="rounded-full border border-[#FF5A5F] py-4"
                    >
                        <Text className="text-center paragraph-semibold text-[#FF5A5F]">
                            Logout
                        </Text>
                    </TouchableOpacity>
                </View>

                {(isLoading || isUploading) && (
                    <Text className="text-center paragraph-regular text-gray-400 mt-4">
                        {isUploading ? 'Uploading image...' : 'Fetching latest profile...'}
                    </Text>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile
