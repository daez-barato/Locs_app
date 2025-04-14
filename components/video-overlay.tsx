import{ View } from 'react-native';
import { StyleSheet } from 'react-native';

import CustomButton from "@/components/custom-button";
import { useThemeConfig } from './ui/use-theme-config';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function VideoOverlay() {
  const { colors } = useThemeConfig();

  return (
    <View style={styles.overlay}>
      <View style={{
        position: 'absolute',
        top: 80,
        right: 20,
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 20,
        padding: 5,
        width: 70,
        height: 30,
      }}
      >
        <FontAwesome
          name="money"
          size={20}
          color={colors.primary}
        >
          80
        </FontAwesome>
      </View>
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        marginBottom: "-120%",
      }}>
        <CustomButton label="Bet " shape="pill"/>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'absolute',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});