import { DefaultTheme, Tabs, useRouter } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { StyleSheet, TouchableOpacity } from "react-native";
import { useAuthContext } from "@/hooks/use-auth-context";

export default function TabLayout(){
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const router = useRouter();
    const { user } = useAuthContext();

    if (!user) {
        return null;
    }

    return (
        <>
            <TouchableOpacity style= {styles.studioButton}
                onPress={() => {router.push('/studio/create')}}
                accessibilityRole="button"
                accessibilityLabel="Create an event"
            >
                <FontAwesome style= {styles.studioPlus}
                    name= "plus"
                    size={27}
                />
            </TouchableOpacity>
            {/* Options every tab shares. The label is the screen's title,
                tinted by the navigator. labelStyle keeps what the old per-tab
                labels rendered: 12pt in the platform's regular system font
                (they were FontAwesome text nodes, whose font has no letters,
                so the text fell back to the system font at the icon's default
                size). */}
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: theme.primary,
                    tabBarInactiveTintColor: theme.text,
                    tabBarLabelStyle: styles.tabBarLabel,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="home" color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="explore"
                    options={{
                        title: "Explore",
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="search" color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="parleys"
                    options={{
                        title: "Parleys",
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="list" color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="shop"
                    options={{
                        title: "Shop",
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="shopping-bag" color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="user/[username]"
                    options={{
                        title: "Profile",
                        tabBarIcon: ({ color }) => (
                            <FontAwesome size={28} name="user" color={color} />
                        ),
                        href: {
                            pathname: '/user/[username]',
                            params: {
                                username: user.username,
                            }
                        },
                    }}
                />
            </Tabs>
        </>
    )
};

const createStyles = (theme: Theme) => StyleSheet.create({
    tabBar: {
        backgroundColor: theme.background,
    },
    tabBarLabel: {
        ...DefaultTheme.fonts.regular,
        fontSize: 12,
    },
    studioButton: {
        zIndex: 1,
        position: "absolute",
        padding: 10,
        width: 50,
        height: 50,
        borderRadius: 360,
        backgroundColor: theme.darker_primary,
        bottom: 150,
        right: 40,
        alignItems: "center",
        alignContent: "center",
        justifyContent: "center"
    },
    studioPlus: {
        color: theme.buttonText
    }
})
