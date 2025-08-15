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

export interface SearchObject {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    type: string;
    expire_date?: string;
}

interface TemplateCardProps {
    item: SearchObject;
    isLoading?: boolean;
    placeholderImage: string;
}

export default function TemplateCard({ item, isLoading = false, placeholderImage }: TemplateCardProps) {
    const theme = useThemeConfig();
    const router = useRouter();

    return (
        <Animated.View
            style={[
                styles(theme).card,
                { 
                    opacity: isLoading ? 0.5 : 1,
                    transform: [{ scale: isLoading ? 0.95 : 1 }]
                }
            ]}
        >
            <TouchableOpacity
                style={styles(theme).cardTouchable}
                onPress={() => router.push(`/studio/${item.id}`)}
                activeOpacity={0.8}
            >
                <Image 
                    source={{ uri: item.thumbnail || placeholderImage}} 
                    style={styles(theme).thumbnail} 
                />
                <View style={styles(theme).cardContent}>
                    <Text style={styles(theme).cardTitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.title}
                    </Text>
                    {item.description && (
                        <Text style={styles(theme).cardDescription}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {item.description}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = (theme: Theme) => StyleSheet.create({
    card: {
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
    cardTouchable: {
        flexDirection: 'row',
        padding: 16,
    },
    thumbnail: {
        width: 64,
        height: 64,
        borderRadius: 12,
        marginRight: 16,
        backgroundColor: theme.cardBorder,
    },
    cardContent: {
        flex: 1,
        justifyContent: 'center',
    },
    cardTitle: {
        color: theme.cardText,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        lineHeight: 20,
    },
    cardDescription: {
        color: theme.cardText,
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 18,
        marginBottom: 4,
    },
});