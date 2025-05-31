import { Tabs, useFocusEffect, useRouter} from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useThemeConfig } from "@/components/ui/use-theme-config";
import { useAuth } from "@/api/context/AuthContext";
import { useCallback } from "react";


export default function TabLayout(){
    const theme = useThemeConfig();
    const router = useRouter();
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
                            color={focused? theme.primary : theme.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: theme.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? theme.primary : theme.text }}>
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
                            color={focused? theme.primary : theme.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: theme.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? theme.primary : theme.text }}>
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
                            color={focused? theme.primary : theme.text} 
                        />
                    ),

                    animation: "shift",
                    tabBarStyle: { backgroundColor: theme.background, display: "none" },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? theme.primary : theme.text }}>
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
                            color={focused? theme.primary : theme.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: theme.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? theme.primary : theme.text }}>
                            Parleys
                        </FontAwesome>
                    ),
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="user/[user]"
                options = {{
                    title:"Profile",
                    tabBarIcon: ({ focused }: {focused: boolean}) => (
                        <FontAwesome 
                            size={28} 
                            name="user" 
                            color={focused? theme.primary : theme.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: theme.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? theme.primary : theme.text }}>
                            Profile
                        </FontAwesome>
                    ),
                    href: {
                        pathname: 'user/[user]',
                        params: {
                            user: authState?.userName,
                        }
                    },
                    
                    headerShown: false,
                }}
            />
        </Tabs>
    )
}
