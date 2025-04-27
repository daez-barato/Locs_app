import { router, Tabs, useFocusEffect} from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useThemeConfig } from "@/components/ui/use-theme-config";
import { useAuth } from "@/api/context/AuthContext";
import { useCallback } from "react";


export default function TabLayout(){
    const { colors } = useThemeConfig();

    const { authState } = useAuth();

    useFocusEffect(
        useCallback( () => {
            if (!authState?.authenticated) {
                router.replace('/(auth)');
            }
        }, [authState?.authenticated])
    ); 

    return (
        <Tabs>
            <Tabs.Screen 
                name= "index" 
                options = {{
                    title: "home",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <FontAwesome 
                            size={28} 
                            name="home" 
                            color={focused? colors.primary : colors.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: colors.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? colors.primary : colors.text }}>
                            Home
                        </FontAwesome>
                    ),
                    headerShown: false,
                }}
            />
            <Tabs.Screen 
                name= "explore"
                options = {{
                    title: "Explore",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <FontAwesome 
                            size={28} 
                            name="search" 
                            color={focused? colors.primary : colors.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: colors.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? colors.primary : colors.text }}>
                            Explore
                        </FontAwesome>
                    ),
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="studio"

                options = {{
                    title:"Studio",
                    tabBarIcon: ({ focused }: {focused: boolean}) => (
                        <FontAwesome 
                            size={28} 
                            name="plus" 
                            color={focused? colors.primary : colors.text} 
                        />
                    ),

                    animation: "shift",
                    tabBarStyle: { backgroundColor: colors.background, display: "none" },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? colors.primary : colors.text }}>
                            Studio
                        </FontAwesome>
                    ),
                    headerShown: false,
                }}
            />
            <Tabs.Screen 
                name= "parleys" 
                options = {{
                    title: "parleys",
                    tabBarIcon: ({ focused }: { focused: boolean }) => (
                        <FontAwesome 
                            size={28} 
                            name="list" 
                            color={focused? colors.primary : colors.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: colors.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? colors.primary : colors.text }}>
                            Parleys
                        </FontAwesome>
                    ),
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="profile"
                options = {{
                    title:"Profile",
                    tabBarIcon: ({ focused }: {focused: boolean}) => (
                        <FontAwesome 
                            size={28} 
                            name="user" 
                            color={focused? colors.primary : colors.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: colors.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? colors.primary : colors.text }}>
                            Profile
                        </FontAwesome>
                    ),
                    
                    headerShown: false,
                }}
            />
        </Tabs>
    )
}
