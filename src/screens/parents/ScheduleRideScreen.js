import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Placeholder para dados das crianças
const MOCK_CHILDREN_DATA = [
    { id: 'child1', name: 'Lucas' },
    { id: 'child2', name: 'Sofia' },
];

const DESTINATION_ICON = require('./assets/search.png'); // Descomentado!

const ScheduleRideScreen = ({ route, navigation }) => {
  console.log("[ScheduleRideScreen] INÍCIO DO COMPONENTE. route.params recebidos:", JSON.stringify(route.params, null, 2));

  const { selectedPlaceDetails } = route.params || {};
  console.log("[ScheduleRideScreen] Valor de 'selectedPlaceDetails' após desestruturação:", JSON.stringify(selectedPlaceDetails, null, 2));

  const [selectedDateTime, setSelectedDateTime] = useState(new Date());
  const [isDateTimeNow, setIsDateTimeNow] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState(MOCK_CHILDREN_DATA[0]?.id || null);
  const [messageToDriver, setMessageToDriver] = useState('');

  console.log(`[ScheduleRideScreen] Estado inicial: selectedDateTime=${selectedDateTime.toISOString()}, isDateTimeNow=${isDateTimeNow}, selectedChildId=${selectedChildId}, messageToDriver="${messageToDriver}"`);

  const handleFindDriver = () => {
    console.log("[ScheduleRideScreen] Botão 'Buscar Motorista' pressionado.");
    if (!selectedPlaceDetails) {
        console.error("[ScheduleRideScreen] handleFindDriver: selectedPlaceDetails é inválido!");
        Alert.alert("Erro", "Detalhes do local não encontrados. Por favor, tente novamente.");
        return;
    }
    if (!selectedChildId) {
      console.warn("[ScheduleRideScreen] Tentativa de buscar motorista sem selecionar criança.");
      Alert.alert("Atenção", "Por favor, selecione para qual criança é a corrida.");
      return;
    }

    const rideDetails = {
      destinationName: selectedPlaceDetails?.name,
      destinationAddress: selectedPlaceDetails?.formatted_address,
      destinationCoords: selectedPlaceDetails?.geometry?.location,
      dateTime: isDateTimeNow ?
        'now' : selectedDateTime.toISOString(),
      childId: selectedChildId,
      message: messageToDriver,
    };
    console.log("[ScheduleRideScreen] Detalhes da corrida a serem enviados para FindingDriverScreen:", JSON.stringify(rideDetails, null, 2));
    if (!rideDetails.destinationName) {
      console.warn("[ScheduleRideScreen] handleFindDriver: destinationName está faltando em rideDetails!");
    }
    if (!rideDetails.destinationAddress) {
      console.warn("[ScheduleRideScreen] handleFindDriver: destinationAddress está faltando em rideDetails!");
    }

    navigation.navigate('FindingDriverScreen', { rideDetails });
  };

  if (!selectedPlaceDetails) {
    console.error("[ScheduleRideScreen] BLOCO IF: selectedPlaceDetails é undefined ou null. Renderizando tela de erro.");
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>{`Nenhum local selecionado.`}</Text>
          <Text style={styles.errorTextDetail}>{`Por favor, volte e selecione um destino.`}</Text>
          <TouchableOpacity style={styles.errorBackButton} onPress={() => {
              console.log("[ScheduleRideScreen] Botão 'Voltar' da tela de erro pressionado.");
              if (navigation && typeof navigation.goBack === 'function') {
              navigation.goBack();
              } else {
                console.error("[ScheduleRideScreen] navigation.goBack não é uma função ou navigation é undefined.");
              }
            }}>
            <Text style={styles.errorBackButtonText}>{`Voltar`}</Text>
   
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Logs ANTES do return principal
  console.log("[ScheduleRideScreen] PREPARANDO PARA RENDERIZAR TELA (Passo 2: Com Header).");
  console.log("  > selectedPlaceDetails.name (tipo):", typeof selectedPlaceDetails?.name, "Valor:", selectedPlaceDetails?.name);
  console.log("  > selectedPlaceDetails.formatted_address (tipo):", typeof selectedPlaceDetails?.formatted_address, "Valor:", selectedPlaceDetails?.formatted_address);
  console.log("[ScheduleRideScreen] DADOS VERIFICADOS. Iniciando renderização do JSX (Passo 2: Com Header).");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                console.log("[ScheduleRideScreen] Botão 'Voltar' no header pressionado.");
                navigation.goBack();
            
              }}
              style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#007AFF" /> 
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Agendar Corrida</Text>
            <View style={{width: 44}} />
        </View>

       
        {/* Removido o conteúdo de teste e reintroduzida a seção "Local Escolhido" */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destino</Text>
          <View style={styles.locationCard}>
            <Image source={DESTINATION_ICON} style={styles.locationIcon} />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationName} numberOfLines={1}>{String(selectedPlaceDetails?.name ?? 'Nome indisponível')}</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>{String(selectedPlaceDetails?.formatted_address ?? 'Endereço indisponível')}</Text>
            </View>
          </View>
        </View>

        {/* Próximo passo: Reintroduzir a seção "Data e Hora" aqui */}

      </ScrollView>
      {/* Próximo passo: Reintroduzir o footer com o botão "Buscar Motorista" aqui 
       */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  
  locationIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
    resizeMode: 'contain',
  },
  locationTextContainer: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateTimeButton: {
    flex: 1,
    
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#EFEFF4',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  dateTimeButtonActive: {
    backgroundColor: '#007AFF',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  dateTimeButtonTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  childrenScroll: {
    paddingBottom: 10,
  },
  childCard: {
    
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    minWidth: 80,
  },
  childCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E0EFFF',
  },
  childAvatar: { // Mantido para quando reintroduzir
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  childName: {
    fontSize: 14,
    color: '#333',
  },
  
  messageInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 10,
    minHeight: 80,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  findDriverButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  findDriverButtonText: {
    
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: { // Estilo para o fallback de erro
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorTextDetail: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorBackButton: {
    backgroundColor: '#007AFF',
    
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  errorBackButtonText: {
    color: 'white',
    fontSize: 16,
  }
});
export default ScheduleRideScreen;