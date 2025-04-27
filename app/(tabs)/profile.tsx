import { useThemeConfig } from "@/components/ui/use-theme-config";
import { View, StyleSheet, Image, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React, { useCallback, useState } from "react";
import { useCoins } from "@/api/context/coinContext";
import { useAuth } from "@/api/context/AuthContext";
import { useFocusEffect } from "expo-router";
import { getFollowerCount, getFollowingCount } from "@/api/profileFuntions";

const placeholderImage = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Vector_WikiAnswers_Orange_Avatar_Lady_Incognito.svg/960px-Vector_WikiAnswers_Orange_Avatar_Lady_Incognito.svg.png?20241130025355"; // Placeholder image URL

export default function Profile() {
    const { colors } = useThemeConfig();
    const { authState } = useAuth();
    const profileImage = "";
    const [activeList, setActiveList] = useState<"created" | "participated">("created");
    const { coins, fetchCoins } = useCoins();
    const [followers, setFollowers] = useState<number>();
    const [following, setFollowing] = useState<number>();
    const [username, setUsername] = useState<string | null>();

    // Fetch data when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                try {
                    setUsername(authState?.userName);
                    fetchCoins(); // Make sure you await this too
    
                    const followerCount = await getFollowerCount(); // <-- Add await here
                    const followingCount = await getFollowingCount();
                    setFollowers(followerCount);
                    setFollowing(followingCount);

                } catch (err) {
                    console.error("Error fetching data:", err);
                }
            };
            fetchData();
        }, [])
    );

    // Dummy data
    const betsCreated = [
        { id: "1", title: "Bet 1" },
        { id: "2", title: "Bet 2" },
        { id: "3", title: "Bet 3" },
    ];
    const betsParticipated = [
        { id: "1", title: "Bet A" },
        { id: "2", title: "Bet B" },
        { id: "3", title: "Bet C" },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Settings Button */}
            <TouchableOpacity style={styles.settingsButton} onPress={() => alert("Settings clicked!")}>
                <Text style={{ color: colors.button, fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>

            {/* Top Section */}
            <View style={[styles.topContainer, { backgroundColor: colors.background }]}>
                {/* Profile Image */}
                <Image
                    source={{ uri: profileImage || placeholderImage }} // Use placeholder if profileImage is empty
                    style={{ width: 150, height: 150, borderRadius: 150, backgroundColor: colors.button_darker_primary }}
                />

                {/* Username */}
                <Text
                    style={{
                        textAlign: "center",
                        color: colors.buttonText,
                        fontSize: 18,
                        fontWeight: "bold",
                        fontFamily: "Roboto",
                        marginTop: 10,
                    }}
                >
                    {authState?.userName}
                </Text>

                {/* Follower and Following Counts */}
                <View style={styles.statsContainer}>
                    <Text style={[styles.statsText, { color: colors.buttonText }]}>Followers: {followers}</Text>
                    <Text style={[styles.statsText, { color: colors.buttonText }]}>Following: {following}</Text>
                </View>

                {/* Money Count */}
                <Text style={[styles.moneyText, { color: colors.button_darker_primary }]}>💰 ${coins}</Text>

                {/* Edit Profile Button */}
                <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.primary }]}
                    onPress={() => alert("Edit Profile clicked!")}
                >
                    <Text style={{ color: colors.background, fontWeight: "bold" }}>Edit Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom Section */}
            <View style={[styles.bottomContainer, { backgroundColor: colors.button_darker_primary }]}>
                {/* Buttons to switch between lists */}
                <View style={styles.switchButtonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.switchButton,
                            activeList === "created" && { backgroundColor: colors.button },
                        ]}
                        onPress={() => setActiveList("created")}
                    >
                        <Text style={{ color: activeList === "created" ? colors.button_darker_primary : colors.buttonText }}>
                            Bets Created
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.switchButton,
                            activeList === "participated" && { backgroundColor: colors.button },
                        ]}
                        onPress={() => setActiveList("participated")}
                    >
                        <Text style={{ color: activeList === "participated" ? colors.button_darker_primary : colors.buttonText }}>
                            Bets Participated
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* FlatList for Bets */}
                <View style={styles.betsListContainer}>
                    {activeList === "created" ? (
                        <FlatList
                            data={betsCreated}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <Text style={{ color: colors.buttonText, marginVertical: 5 }}>{item.title}</Text>
                            )}
                        />
                    ) : (
                        <FlatList
                            data={betsParticipated}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <Text style={{ color: colors.buttonText, marginVertical: 5 }}>{item.title}</Text>
                            )}
                        />
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topContainer: {
        flex: 1.5, // Takes up less space
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    bottomContainer: {
        flex: 1.5, // Reduced height for the bottom section
        justifyContent: "flex-start",
        alignItems: "center",
        paddingTop: 20,
    },
    settingsButton: {
        position: "absolute",
        top: 50,
        right: 20,
        zIndex: 1,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "60%",
        marginTop: 10,
    },
    statsText: {
        fontSize: 14,
        fontWeight: "bold",
    },
    moneyText: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 10,
    },
    editButton: {
        marginTop: 15,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    switchButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginBottom: 10,
    },
    switchButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "gray",
    },
    betsListContainer: {
        height: 400, // Limit the height of the FlatList
        width: "90%", // Adjust width to make it look centered
        borderRadius: 10, // Optional: Add rounded corners
        padding: 10, // Add padding for spacing
        marginTop: 10, // Add margin to separate it from other elements
    },
});