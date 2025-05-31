import { Pressable, View, StyleSheet, Text, ViewStyle, TextStyle } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useThemeConfig } from "@/components/ui/use-theme-config";

type ButtonSize = "sm" | "md" | "lg";
type ButtonLayout = "side-by-side" | "centered"; // New layout option

type Props = {
    label?: string;
    color?: "primary" | "transparent" | "destructive";
    onPress?: () => void;
    icon?: keyof typeof FontAwesome.glyphMap;
    iconSize?: number;
    shape?: "rounded" | "pill";
    fullWidth?: boolean;
    size?: ButtonSize;
    style?: ViewStyle;
    textStyle?: TextStyle;
    layout?: ButtonLayout; // New prop for layout
};

export default function CustomButton({
    label,
    color = "primary",
    onPress,
    icon,
    iconSize,
    shape = "rounded",
    fullWidth = false,
    size = "md",
    style,
    textStyle,
    layout = "side-by-side", // Default layout is side-by-side
}: Props) {
    const colors  = useThemeConfig();

    const isPill = shape === "pill";
    const bgColor = {
        primary: colors.button,
        transparent: "transparent",
        destructive: colors.destructive,
    }[color];

    const sizeMap = {
        sm: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            fontSize: 12,
            height: isPill ? 36 : undefined,
            iconSize: 16,
        },
        md: {
            paddingVertical: 10,
            paddingHorizontal: 16,
            fontSize: 14,
            height: isPill ? 48 : undefined,
            iconSize: 20,
        },
        lg: {
            paddingVertical: 14,
            paddingHorizontal: 20,
            fontSize: 16,
            height: isPill ? 60 : undefined,
            iconSize: 24,
        },
    }[size];

    const containerStyle: ViewStyle = {
        backgroundColor: bgColor,
        borderRadius: isPill ? 999 : 8,
        alignSelf: fullWidth ? "stretch" : "flex-start",
        ...style,
    };

    const pressableStyle: ViewStyle = {
        flexDirection: layout === "side-by-side" ? "row" : "column", // Flex direction based on layout
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: sizeMap.paddingVertical,
        paddingHorizontal: sizeMap.paddingHorizontal,
        borderRadius: isPill ? 999 : 8,
        width: fullWidth ? "100%" : undefined,
        height: sizeMap.height,
    };

    const textStyles: TextStyle = {
        color: colors.buttonText,
        fontSize: sizeMap.fontSize,
        fontWeight: "bold",
        marginLeft: icon && label && layout === "side-by-side" ? 8 : 0, // Space between icon and label in side-by-side layout
        marginTop: layout === "centered" ? 8 : 0, // Extra space above text when centered
        ...textStyle,
    };

    return (
        <View style={containerStyle}>
            <Pressable
                onPress={onPress}
                android_ripple={{ color: color === "transparent" ? "transparent" : colors.secondary }}
                style={pressableStyle}
            >
                {icon && (
                    <FontAwesome
                        name={icon}
                        size={iconSize || sizeMap.iconSize}
                        color={colors.buttonText}
                    />
                )}
                {label && <Text style={textStyles}>{label}</Text>}
            </Pressable>
        </View>
    );
}
