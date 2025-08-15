import { Tabs, useFocusEffect, useRouter} from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import { useAuth } from "@/api/context/AuthContext";
import { useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";


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
        <>
            <TouchableOpacity style= {styles(theme).studioButton}
                onPress={() => {router.push('/studio/create')}}
            >
                <FontAwesome style= {styles(theme).studioPlus}
                    name= "plus"
                    size={27}
                />
            </TouchableOpacity>
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
        </>
    )
};

const styles = (theme: Theme) => StyleSheet.create({
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
