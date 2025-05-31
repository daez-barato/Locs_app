import { Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Theme, useThemeConfig } from '@/components/ui/use-theme-config';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { eventInformation } from '@/api/eventFunctions';



export default function eventScreen() {
  const { eventId } = useLocalSearchParams();
  const theme = useThemeConfig();

  useEffect(() => {
    async function fetchData(){
        try{
            const eventInfo = await eventInformation(eventId as string);
        } catch (err){
            console.error('Failed to fetch data', err);
        }
    }

    fetchData()
  }, [])

  return (
    <SafeAreaView style={styles(theme).container}>
      <Text style={styles(theme).textContainer}>Event ID: {eventId}</Text>
    </SafeAreaView>
  );
}


const styles = (theme: Theme) => StyleSheet.create({
    container:{
        flex: 1,
        backgroundColor: theme.background,
    },
    textContainer:{
        flex:1,
        backgroundColor: theme.secondary,
        maxHeight: 30,
    }
})