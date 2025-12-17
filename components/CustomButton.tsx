import {View, Text, TouchableOpacity, ActivityIndicator} from 'react-native'
import React from 'react'
import {CustomButtonProps} from "@/type";
import cn from "clsx";
import {router} from "expo-router";


const CustomButton = ({
                          onPress,
                          title = 'Click Me',
                          style,
                          leftIcon,
                          textStyle,
                          isLoading = false,
                          disabled = false,
                      }: CustomButtonProps) => {
    return (
        <TouchableOpacity 
            className={cn('custom-btn', style, disabled && 'opacity-50')} 
            onPress={onPress}
            disabled={disabled || isLoading}
        >
            {leftIcon}

            <View className="flex-center flex-row">
                {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text className={cn('text-white-100 paragraph-semibold', textStyle, disabled && 'opacity-50')}>
                        {title}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    )
}
export default CustomButton
