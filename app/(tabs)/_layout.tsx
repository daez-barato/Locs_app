import { DefaultTheme, Tabs } from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { StyleSheet } from "react-native";
import { useAuthContext } from "@/hooks/use-auth-context";
import CreateEventButton from "@/components/create-event-button";
import { haptics } from "@/utils/haptics";

export default function TabLayout(){
    const theme = useThemeConfig();
    const styles = useThemedStyles(createStyles);
    const { user } = useAuthContext();

    if (!user) {
        return null;
    }

    return (
        <>
            <CreateEventButton />
            {/* Options every tab shares. The label is the screen's title,
                tinted by the navigator. labelStyle keeps what the old per-tab
                labels rendered: 12pt in the platform's regular system font
                (they were FontAwesome text nodes, whose font has no letters,
                so the text fell back to the system font at the icon's default
                size). */}
            <Tabs
                screenListeners={{ tabPress: () => { haptics.select(); } }}
                screenOptions={{
                    // The navigator's header replaces each tab's hand-built
                    // title row and handles the status-bar inset itself.
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.background },
                    headerShadowVisible: false,
                    headerTitleAlign: "left",
                    headerTintColor: theme.text,
                    headerTitleStyle: styles.headerTitle,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: theme.primary,
                    // Was theme.text, the same teal as the active tint, so the bar
                    // gave no sign of which tab was selected.
                    tabBarInactiveTintColor: theme.muted,
                    tabBarLabelStyle: styles.tabBarLabel,
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        headerTitle: "Following",
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
                        headerTitle: "My Parleys",
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
    headerTitle: {
        fontSize: 26,
        fontWeight: "700",
    },
    tabBarLabel: {
        ...DefaultTheme.fonts.regular,
        fontSize: 12,
    },
})
