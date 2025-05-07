import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/parents/HomeScreen'; // We'll create this later
import SearchScreen from './screens/parents/SearchScreen'; // Importar a SearchScreen
import ScheduleRideScreen from './screens/parents/ScheduleRideScreen'; // And this one

const Stack = createStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'KidGo' }} 
        />
        <Stack.Screen 
          name="SearchScreen" 
          component={SearchScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="ScheduleRide" 
          component={ScheduleRideScreen} 
          options={{ title: 'Schedule Ride' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;