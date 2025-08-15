import { useColorScheme } from "react-native";
import { darkTheme, lightTheme } from "../../theme";

export interface Theme{
    background: string,
    text: string,
    primary: string,
    darker_primary: string,
    button: string,
    buttonText: string,
    secondary: string,
    void: string,
    button_darker_primary: string,
    destructive: string,
    destructiveText: string,
    cardBackground: string,
    cardBorder: string,
    card: string,
    border: string,
    cardText: string,
};


export function useThemeConfig(): Theme{
    const colorScheme = useColorScheme();

    if (colorScheme === "dark") return darkTheme;

    return lightTheme;
}