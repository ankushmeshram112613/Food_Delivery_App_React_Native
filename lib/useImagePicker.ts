import { useState } from 'react'
import { Alert } from 'react-native'
import * as ImagePicker from 'expo-image-picker'

const useImagePicker = () => {
    const [isPicking, setIsPicking] = useState(false)

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!')
            return null
        }

        setIsPicking(true)
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            })

            if (!result.canceled) {
                return result.assets[0]
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image. Please try again.')
        } finally {
            setIsPicking(false)
        }

        return null
    }

    return { pickImage, isPicking }
}

export default useImagePicker
