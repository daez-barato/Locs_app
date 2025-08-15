import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { useRouter } from "expo-router";
import React from "react";
import { 
    Text, 
    View, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    Animated
} from "react-native";
import { SearchObject } from "./templateCard";

interface UserCardProps {
    user: SearchObject;
    isLoading?: boolean;
    placeholderImage: string;
}

export default function UserCard({ user, isLoading = false, placeholderImage }: UserCardProps) {
    const theme = useThemeConfig();
    const router = useRouter();

    return (
        <Animated.View
            style={[
                styles(theme).userCard,
                { 
                    opacity: isLoading ? 0.5 : 1,
                    transform: [{ scale: isLoading ? 0.95 : 1 }]
                }
            ]}
        >
            <TouchableOpacity
                style={styles(theme).userCardTouchable}
                onPress={() => router.push(`/user/${user.title}`)}
                activeOpacity={0.8}
            >
                <Image 
                    source={{ uri: user.thumbnail || placeholderImage }} 
                    style={styles(theme).avatar} 
                />
                <View style={styles(theme).userInfo}>
                    <Text style={styles(theme).username}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        @{user.title}
                    </Text>
                    {user.description && (
                        <Text style={styles(theme).bio} numberOfLines={2}>
                            {user.description}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = (theme: Theme) => StyleSheet.create({
    userCard: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        overflow: 'hidden',
    },
    userCardTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 16,
        backgroundColor: theme.cardBorder,
    },
    userInfo: {
        flex: 1,
    },
    username: {
        color: theme.cardText,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    bio: {
        color: theme.cardText,
        fontSize: 13,
        opacity: 0.8,
        lineHeight: 16,
    },
});