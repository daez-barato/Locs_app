import { useColorScheme } from "react-native";
import { darkTheme, lightTheme } from "../../theme";


export function useThemeConfig() {
    const colorScheme = useColorScheme();

    if (colorScheme === "dark") return darkTheme;

    return lightTheme;
}