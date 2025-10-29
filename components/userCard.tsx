import { acceptFollowRequest, rejectFollowRequest, followRequest, unfollowRequest  } from "@/api/followers/followers";
import { SearchUser } from "@/api/interfaces/objects";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Alert,
} from "react-native";

export default function UserCard({ user }: { user: SearchUser }) {
  const theme = useThemeConfig();
  const router = useRouter();

  const [followLabel, setFollowLabel] = useState<"Requested" | "Following" | "Follow" | "Follow back">((user.is_following) ? "Following" : (user.has_requested) ? "Requested" : "Follow");
  const [userState, setUser] = useState<SearchUser>(user);

  const handleFollowLabel = async () => {
    try {
      let result
      if (followLabel === "Follow" || followLabel === "Follow back"){
        result = await followRequest(user.id);
        if (result.error){
          throw new Error(result.message)
        }
        if (result.following){
          setFollowLabel("Following")
        }else if (result.requested) {
          setFollowLabel("Requested")
        }
      }
      else {
        result = await unfollowRequest(user.id);
        if (result.error){
          throw new Error(result.message)
        }
        setFollowLabel("Follow");
      }

    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not follow/unfollow user");
    }
  };

  const handleAccept = async () => {
    try {
      const result = await acceptFollowRequest(user.id);
      if (result.error){
        throw new Error(result.message)
      }
      setUser(prev => ({
        ...prev,
        requester: undefined
      }))
      setFollowLabel(user.is_following ? "Following" : (user.has_requested) ? "Requested" : "Follow back")
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not accept request");
    }
  };

  const handleRefuse = async () => {
    try {
      const result = await rejectFollowRequest(user.id);
      if (result.error){
        throw new Error(result.message)
      }
      setUser(prev => ({
        ...prev,
        requester: undefined
      }))
      setFollowLabel(user.is_following ? "Following" : (user.has_requested) ? "Requested" : "Follow back")
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not reject request");
    }
  };

  return (
    <Animated.View
      style={[
        styles(theme).userCard,
        {
          opacity: 1,
          transform: [{ scale: 1 }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles(theme).userCardTouchable}
        onPress={() => router.push(`/user/${user.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles(theme).avatarContainer}>
          <Image
            source={{ uri: userState.profile_image }}
            style={styles(theme).avatar}
            resizeMode="cover"
          />
        </View>

        <View style={styles(theme).userInfo}>
          <View style={styles(theme).userHeader}>
            <Text
              style={styles(theme).username}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              @{userState.username}
            </Text>

            {/* --- Case 1: Follow requests --- */}
            {userState.requester !== undefined && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={styles(theme).acceptButton}
                  onPress={handleAccept}
                >
                  <Text>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles(theme).refuseButton}
                  onPress={handleRefuse}
                >
                  <FontAwesome name="times" size={18} color={theme.void} />
                </TouchableOpacity>
              </View>
            )}
            {/* --- Case 3: Normal follow/following states --- */}
            {userState.requester === undefined && userState.is_following !== undefined && (
              <View style={styles(theme).userFooter}>
                  <TouchableOpacity
                    onPress={handleFollowLabel}
                    style={(followLabel === "Following" || followLabel === "Requested") ? styles(theme).followingIndicator : styles(theme).actionIndicator}
                  >
                    {(followLabel === "Following" || followLabel === "Requested") ?
                    <FontAwesome name="check" size={12} color="#4CAF50" />
                    : <FontAwesome name="user-plus" size={12} color={theme.primary} />}

                    <Text style={(followLabel === "Following" || followLabel === "Requested") ? styles(theme).followingText : styles(theme).actionText}>
                      {followLabel}
                    </Text>                    
                  </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = (theme: Theme) => StyleSheet.create({
    userCard: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.cardBorder + '40',
    },
    userCardTouchable: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.cardBorder,
        borderWidth: 2,
        borderColor: theme.card,
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
        borderColor: theme.card,
    },
    userInfo: {
        flex: 1,
    },
    userHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    username: {
        color: theme.cardText,
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: theme.cardBorder + '30',
        borderRadius: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    bio: {
        color: theme.cardText,
        fontSize: 13,
        opacity: 0.8,
        lineHeight: 16,
        marginBottom: 8,
    },
    userFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    actionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    actionText: {
        color: theme.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    followingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#4CAF50' + '20',
        borderRadius: 8,
    },
    followingText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    acceptButton: {
        backgroundColor: "#4CAF50",
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    refuseButton: {
        backgroundColor: "#F44336",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    followBackButton: {
        backgroundColor: theme.primary,
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    followBackText: {
        color: theme.void,
        fontWeight: "600",
    },

});