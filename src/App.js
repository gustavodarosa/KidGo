import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './presentation/screens/parents/HomeScreen';
import ScheduleRideScreen from './presentation/screens/parents/ScheduleRideScreen';
import AvailableRidesScreen from './presentation/screens/drivers/AvailableRidesScreen';
import RideDetailsScreen from './presentation/screens/drivers/RideDetailsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Schedule Ride" component={ScheduleRideScreen} />
        <Stack.Screen name="Available Rides" component={AvailableRidesScreen} />
        <Stack.Screen name="Ride Details" component={RideDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;