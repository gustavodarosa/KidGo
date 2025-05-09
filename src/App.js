import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
// Vamos importar SOMENTE o SearchScreen para focar nele
import SearchScreen from './screens/parents/SearchScreen';
import ScheduleRideScreen from './screens/parents/ScheduleRideScreen'; // Importar a ScheduleRideScreen

const Stack = createStackNavigator();

function App() {
  console.log("[App.js] Configurando para focar no SearchScreen.");
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Search" // Mudando o nome para algo mais genérico, já que vamos adicionar outra tela
          component={SearchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ScheduleRide" // Este é o nome que SearchScreen usa para navegar
          component={ScheduleRideScreen}
          options={{ headerShown: false }} // Mantendo o padrão de esconder o header do stack
        />
        {/* Adicione outras telas aqui conforme necessário para seus testes */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
