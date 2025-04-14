import { Tabs, useRouter} from "expo-router";

import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useThemeConfig } from "@/components/ui/use-theme-config";


export default function TabLayout(){
    const { colors } = useThemeConfig();
    const router = useRouter();

    return (
        <Tabs>
            <Tabs.Screen 
                name= "index" 
                
                options = {{
                    title: "Home",
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
            <Tabs.Screen
                name="test"
                options = {{
                    title:"Test",
                    tabBarIcon: ({ focused }: {focused: boolean}) => (
                        <FontAwesome 
                            size={28} 
                            name="circle" 
                            color={focused? colors.primary : colors.text} 
                        />
                    ),
                    tabBarStyle: { backgroundColor: colors.background },
                    tabBarLabel: ({ focused }: {focused: boolean}) => (
                        <FontAwesome style={{ color: focused ? colors.primary : colors.text }}>
                            Test
                        </FontAwesome>
                    ),
                    
                    headerShown: false,
                }}
            />
        </Tabs>
    )
}
