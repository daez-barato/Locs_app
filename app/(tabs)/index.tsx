import { userRecommendations, Recommendation } from "@/api/fyFunctions";
import { useThemeConfig, Theme } from "@/components/ui/use-theme-config"
import { useEffect, useState } from "react"
import { FlatList, StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import RecommendationItem from "@/components/recommendation";



export default function Home(){
  const [refresh, activateRefresh] = useState(false);
  const theme = useThemeConfig()
  const [recommendationList, updateRecommendationList] = useState<Recommendation[]>([])

  useEffect( () =>{
    async function fetchData(){
      try {
        //const recommendations = await userRecommendations();
        //updateRecommendationList(recommendations);
      } catch(err){
        console.error('Failed to fetch data', err);
      }
    }
    
    fetchData();

  }, [refresh])
  
  return (
    <SafeAreaView style={styles(theme).backgroundContainer}>
    <FlatList style={styles(theme).betList}
        data={recommendationList}
        keyExtractor={(item) => item.id}
        renderItem= {({item}) => <RecommendationItem item={item}/>}
      /> 
    </SafeAreaView>
  )
}

const styles = (theme: Theme) => StyleSheet.create({
  backgroundContainer: {
    flex: 1,
    backgroundColor: theme.background
  },
  betList:{
    flex: 1,
    backgroundColor: theme.background
  }
})