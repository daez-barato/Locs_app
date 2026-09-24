import { Theme, useThemeConfig } from "@/components/ui/use-theme-config";
import AvatarImage from "@/components/ui/avatar-image";
import { CoinAmount, CoinIcon } from "@/components/ui/coin";
import RarityBadge, { rarityColor } from "@/components/ui/rarity-badge";
import { withAlpha } from "@/theme";
import { useThemedStyles } from "@/hooks/use-themed-styles";
import { useCoinContext } from "@/hooks/use-coin-context";
import { getShopItems } from "@/services/shop";
import { getMyCoins } from "@/services/users";
import { ShopItem } from "@/types/interfaces";
import { FontAwesome } from "@expo/vector-icons";
import { Tabs, useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function Shop() {
  const theme = useThemeConfig();
  const styles = useThemedStyles(createStyles);
  const { coins, setCoinAmount } = useCoinContext();
  const router = useRouter();

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoaded = useRef(false);

  const load = useCallback(async (mode: "initial" | "refresh" | "silent") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    const [result, balance] = await Promise.all([getShopItems(), getMyCoins()]);

    if (result.error) {
      // A failed background refresh keeps what's on screen; only an empty
      // screen gets the error state.
      if (!hasLoaded.current) setErrorMessage(result.msg);
    } else {
      setItems(result.items);
      setErrorMessage(null);
      hasLoaded.current = true;
    }
    if (balance !== null) setCoinAmount(balance);

    setLoading(false);
    setRefreshing(false);
  }, [setCoinAmount]);

  // Reload whenever the tab gains focus: after buying or equipping in the
  // avatar sheet, betting elsewhere, or equipping from another device.
  useFocusEffect(
    useCallback(() => {
      load(hasLoaded.current ? "silent" : "initial");
    }, [load])
  );

  // The whole card opens the avatar sheet, which is where buying happens:
  // you see the character and its story before spending on it.
  const renderItem = ({ item }: { item: ShopItem }) => {
    const tier = rarityColor(theme, item.rarity);
    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: withAlpha(tier, 0.7) }, item.equipped && styles.cardEquipped]}
        onPress={() => router.push({ pathname: "/avatar", params: { path: item.imagePath } })}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${item.rarity} rarity, ${
          item.equipped ? "equipped" : item.owned ? "owned" : `${item.price} coins`
        }`}
      >
        {/* The tier's colour washing down over the card purple. */}
        <LinearGradient
          colors={[withAlpha(tier, 0.42), withAlpha(tier, 0.1)]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.imageWrapper}>
          <AvatarImage uri={item.imageUrl} style={styles.image} contentFit="cover" />
          {item.equipped && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Equipped</Text>
            </View>
          )}
          <RarityBadge rarity={item.rarity} style={styles.rarityBadge} />
        </View>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        {item.owned || item.price === 0 ? (
          <Text style={styles.price}>{item.equipped ? "Equipped" : "Owned"}</Text>
        ) : (
          <CoinAmount amount={item.price} size={14} textStyle={styles.price} style={styles.priceRow} />
        )}
      </TouchableOpacity>
    );
  };

  const renderBody = () => {
    if (loading && !hasLoaded.current) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.stateText}>Loading shop...</Text>
        </View>
      );
    }

    if (errorMessage && items.length === 0) {
      return (
        <View style={styles.centered}>
          <FontAwesome name="exclamation-circle" size={40} color={theme.primary} />
          <Text style={styles.stateText}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => load("initial")}>
            <FontAwesome name="refresh" size={14} color={theme.buttonText} />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load("refresh")}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.card}
          />
        }
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.stateText}>Nothing for sale right now.</Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <Tabs.Screen
        options={{
          headerRight: () => (
            <View style={styles.balance} accessible accessibilityLabel={`Balance: ${coins} coins`}>
              <CoinIcon size={18} />
              <Text style={styles.balanceText}>{coins}</Text>
            </View>
          ),
        }}
      />
      {renderBody()}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    balance: {
      marginRight: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
    },
    balanceText: {
      fontVariant: ['tabular-nums'],
      color: theme.cardText,
      fontSize: 16,
      fontWeight: "700",
    },
    listContent: {
      padding: 12,
      paddingBottom: 32,
      flexGrow: 1,
    },
    column: {
      justifyContent: "space-between",
    },
    card: {
      width: "48%",
      marginBottom: 12,
      padding: 10,
      paddingBottom: 12,
      borderRadius: 18,
      borderCurve: "continuous",
      // Clips the rarity gradient to the rounded corners.
      overflow: "hidden",
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.cardBorder,
    },
    cardEquipped: {
      borderColor: theme.primary,
      borderWidth: 2,
    },
    imageWrapper: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: theme.cardBorder,
      marginBottom: 8,
    },
    image: {
      width: "100%",
      height: "100%",
    },
    badge: {
      position: "absolute",
      top: 6,
      left: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: theme.success,
    },
    rarityBadge: {
      position: "absolute",
      top: 6,
      right: 6,
    },
    badgeText: {
      color: theme.onAccent,
      fontSize: 11,
      fontWeight: "700",
      textTransform: "uppercase",
    },
    name: {
      color: theme.cardText,
      fontSize: 15,
      fontWeight: "700",
    },
    price: {
      fontVariant: ['tabular-nums'],
      color: theme.muted,
      fontSize: 13,
      marginTop: 2,
    },
    // CoinAmount is a row; the margin that sat on the old Text moves to it.
    priceRow: {
      marginTop: 2,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 12,
    },
    stateText: {
      color: theme.text,
      fontSize: 16,
      textAlign: "center",
    },
    retryButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: theme.button,
    },
    retryText: {
      color: theme.buttonText,
      fontWeight: "600",
    },
  });
