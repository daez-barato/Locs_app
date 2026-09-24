import { acceptFollowRequest, rejectFollowRequest, followRequest, unfollowRequest  } from "@/api/followers/followers";
import { SearchUser } from "@/types/interfaces";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/hooks/use-auth-context";
import React, { useState } from "react";
import AvatarImage from "@/components/ui/avatar-image";
import { resolveAvatarUrl } from "@/utils/avatar";
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";

export default function UserCard({ user }: { user: SearchUser }) {
  const theme = useThemeConfig();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const currentUserId = useAuthContext().user?.id;
  const isSelf = !!currentUserId && currentUserId === user.id;

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
        styles.userCard,
        {
          opacity: 1,
          transform: [{ scale: 1 }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.userCardTouchable}
        onPress={() => router.push(`/user/${user.id}`)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
          <AvatarImage
            uri={resolveAvatarUrl(userState.avatar_url)}
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userHeader}>
            <Text
              style={styles.username}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              @{userState.username}
            </Text>

            {/* --- Case 1: Follow requests --- */}
            {!isSelf && userState.requester !== undefined && (
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Accept follow request from ${userState.username}`}
                  onPress={handleAccept}
                >
                  <Text>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.refuseButton}
                  accessibilityRole="button"
                  accessibilityLabel={`Reject follow request from ${userState.username}`}
                  onPress={handleRefuse}
                >
                  <FontAwesome name="times" size={18} color={theme.void} />
                </TouchableOpacity>
              </View>
            )}
            {/* --- Case 3: Normal follow/following states --- */}
            {!isSelf && userState.requester === undefined && userState.is_following !== undefined && (
              <View style={styles.userFooter}>
                  <TouchableOpacity
                    onPress={handleFollowLabel}
                    style={(followLabel === "Following" || followLabel === "Requested") ? styles.followingIndicator : styles.actionIndicator}
                  >
                    {(followLabel === "Following" || followLabel === "Requested") ?
                    <FontAwesome name="check" size={12} color="#4CAF50" />
                    : <FontAwesome name="user-plus" size={12} color={theme.primary} />}

                    <Text style={(followLabel === "Following" || followLabel === "Requested") ? styles.followingText : styles.actionText}>
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

const createStyles = (theme: Theme) => StyleSheet.create({
    userCard: {
        backgroundColor: theme.card,
        marginHorizontal: 16,
        marginVertical: 8,
        borderRadius: 16,
        shadowColor: theme.shadow,
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

});