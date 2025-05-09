import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch, ActivityIndicator, Image
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// import axios from 'axios'; // Removido - usaremos fetch
// import { MAPBOX_ACCESS_TOKEN } from '@env'; // Removido - OSRM não precisa

const MOCK_CHILDREN_DATA = [
  { id: 'child1', name: 'Lucas', avatar: require('./assets/boy1.png') },
  { id: 'child2', name: 'Sofia', avatar: require('./assets/girl1.png') },
];

const ScheduleRideScreen = ({ route, navigation }) => {
  console.log("[ScheduleRideScreen] --- INÍCIO DA RENDERIZAÇÃO DO COMPONENTE ---");
  console.log("[ScheduleRideScreen] Parâmetros recebidos (route.params):", JSON.stringify(route.params, null, 2));

  const { originDetails, selectedPlaceDetails } = route.params || {};

  const [originPoint, setOriginPoint] = useState(null);
  const [destinationPoint, setDestinationPoint] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(MOCK_CHILDREN_DATA[0]?.id);
  const [parentsWillJoin, setParentsWillJoin] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(null); // Novo estado para o preço
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    console.log("[ScheduleRideScreen] useEffect [originDetails, selectedPlaceDetails] - Verificando detalhes...");
    if (originDetails && originDetails.geometry?.location?.latitude && originDetails.geometry?.location?.longitude) {
      const newOriginPoint = {
        latitude: originDetails.geometry.location.latitude,
        longitude: originDetails.geometry.location.longitude,
        name: originDetails.name || "Origem",
        address: originDetails.formatted_address || "Endereço da origem"
      };
      console.log("[ScheduleRideScreen] OriginPoint definido:", JSON.stringify(newOriginPoint, null, 2));
      setOriginPoint(newOriginPoint);
    } else {
      console.warn("[ScheduleRideScreen] originDetails inválido ou sem coordenadas:", JSON.stringify(originDetails, null, 2));
      Alert.alert("Erro de Origem", "Os dados do local de origem estão incompletos.");
    }

    if (selectedPlaceDetails && selectedPlaceDetails.geometry?.location?.latitude && selectedPlaceDetails.geometry?.location?.longitude) {
      const newDestinationPoint = {
        latitude: selectedPlaceDetails.geometry.location.latitude,
        longitude: selectedPlaceDetails.geometry.location.longitude,
        name: selectedPlaceDetails.name || "Destino",
        address: selectedPlaceDetails.formatted_address || "Endereço do destino"
      };
      console.log("[ScheduleRideScreen] DestinationPoint definido:", JSON.stringify(newDestinationPoint, null, 2));
      setDestinationPoint(newDestinationPoint);
    } else {
      console.warn("[ScheduleRideScreen] selectedPlaceDetails inválido ou sem coordenadas:", JSON.stringify(selectedPlaceDetails, null, 2));
      Alert.alert("Erro de Destino", "Os dados do local de destino estão incompletos.");
    }
  }, [originDetails, selectedPlaceDetails]);


  const fetchRoute = useCallback(async () => {
    if (!originPoint || !destinationPoint) {
      console.log("[ScheduleRideScreen] fetchRoute: Origem ou Destino ainda não definidos. Abortando.");
      return;
    }
    console.log("[ScheduleRideScreen] fetchRoute: Iniciando busca da rota.");
    setLoadingRoute(true);
    setRouteCoords([]);
    setEstimatedPrice(null); // Reseta o preço ao buscar nova rota

    try {
      // URL para o servidor público do OSRM
      const originCoordsString = `${originPoint.longitude},${originPoint.latitude}`;
      const destinationCoordsString = `${destinationPoint.longitude},${destinationPoint.latitude}`;
      const url = `http://router.project-osrm.org/route/v1/driving/${originCoordsString};${destinationCoordsString}?overview=full&geometries=geojson`;
      console.log("[ScheduleRideScreen] fetchRoute: URL do OSRM:", url);

      const response = await fetch(url);
      const data = await response.json();
      console.log("[ScheduleRideScreen] fetchRoute: Resposta do OSRM (primeiros 500 chars):", JSON.stringify(data, null, 2).substring(0, 500) + "...");

      if (!response.ok) {
        // OSRM pode retornar 200 OK mesmo com erro no 'code', mas tratamos erros de rede aqui
        console.warn(`[ScheduleRideScreen] fetchRoute: Erro de HTTP ${response.status}. Mensagem: ${data.message || 'Erro desconhecido do servidor'}`);
        Alert.alert('Erro de Rota', `Não foi possível obter a rota: ${data.message || response.statusText}`);
        setRouteCoords([]);
      } else if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const coordinates = data.routes[0].geometry.coordinates.map(coord => ({
          latitude: coord[1], // OSRM retorna [longitude, latitude]
          longitude: coord[0],
        }));
        console.log(`[ScheduleRideScreen] fetchRoute: Rota encontrada com ${coordinates.length} pontos.`);
        setRouteCoords(coordinates);

        // --- SIMULAÇÃO DE PREÇO DO BACKEND ---
        // No futuro, o backend poderia retornar o preço junto com os dados da rota ou em uma chamada separada.
        const mockPrice = (Math.random() * (35 - 15) + 15).toFixed(2); // Preço aleatório entre 15 e 35
        console.log("[ScheduleRideScreen] fetchRoute: Preço simulado da corrida:", mockPrice);
        setEstimatedPrice(mockPrice);
        // --- FIM DA SIMULAÇÃO DE PREÇO ---
      } else {
        console.warn("[ScheduleRideScreen] fetchRoute: Nenhuma rota encontrada ou erro na resposta do OSRM. Status:", data.code, "Mensagem:", data.message);
        Alert.alert('Erro de Rota', `Não foi possível obter o traçado da rota: ${data.message || 'Nenhuma rota encontrada.'}`);
        setRouteCoords([]);
      }
    } catch (err) {
      console.error('[ScheduleRideScreen] fetchRoute: Erro ao buscar rota:', err.message);
      Alert.alert('Erro de Rota', 'Falha ao comunicar com o serviço de rotas. Verifique sua conexão.');
    } finally {
      setLoadingRoute(false);
      console.log("[ScheduleRideScreen] fetchRoute: Finalizada.");
    }
  }, [originPoint, destinationPoint]);

  useEffect(() => {
    console.log("[ScheduleRideScreen] useEffect [fetchRoute, originPoint, destinationPoint] - Verificando se deve buscar rota.");
    if (originPoint && destinationPoint) {
      fetchRoute();
    }
  }, [fetchRoute, originPoint, destinationPoint]); // fetchRoute é agora uma dependência por causa do useCallback

  const handleFindDriver = async () => { // Tornando a função assíncrona
    console.log("[ScheduleRideScreen] handleFindDriver: Botão 'Buscar Motorista' pressionado.");
    if (!selectedChildId) {
      Alert.alert('Atenção', 'Selecione qual criança fará a viagem.');
      console.log("[ScheduleRideScreen] handleFindDriver: Nenhuma criança selecionada.");
      return;
    }
    if (!originPoint || !destinationPoint) {
        Alert.alert('Erro', 'Dados de origem ou destino estão faltando.');
        console.log("[ScheduleRideScreen] handleFindDriver: Origem ou destino faltando.");
        return;
    }

    const rideDetails = {
      originCoords: { latitude: originPoint.latitude, longitude: originPoint.longitude },
      destinationCoords: { latitude: destinationPoint.latitude, longitude: destinationPoint.longitude },
      originName: originPoint.name,
      originAddress: originPoint.address,
      destinationName: destinationPoint.name,
      destinationAddress: destinationPoint.address,
      childId: selectedChildId,
      parentsWillJoin,
      estimatedPrice: estimatedPrice, // Adiciona o preço aos detalhes da corrida
    };
    console.log("[ScheduleRideScreen] handleFindDriver: Detalhes da corrida coletados:", JSON.stringify(rideDetails, null, 2));

    // --- LÓGICA FUTURA PARA O BACKEND ---
    try {
      setLoadingRoute(true); // Reutilizar o loading para indicar processamento
      console.log("[ScheduleRideScreen] handleFindDriver: Enviando solicitação de corrida para o backend (simulado)...");

      // Simulação de chamada ao backend
      // No futuro, substitua isso por uma chamada fetch ou axios para sua API:
      // const response = await fetch('URL_DO_SEU_BACKEND/api/request-ride', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', /* Outros headers como Authorization */ },
      //   body: JSON.stringify(rideDetails),
      // });
      // const backendResponse = await response.json();

      // Simulação de resposta do backend
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula latência da rede
      const backendResponse = { success: true, rideRequestId: `ride_${Date.now()}`, message: "Corrida solicitada com sucesso!" };
      console.log("[ScheduleRideScreen] handleFindDriver: Resposta do backend (simulada):", JSON.stringify(backendResponse, null, 2));

      if (backendResponse.success) {
        navigation.navigate('FindingDriverScreen', { rideDetails, rideRequestId: backendResponse.rideRequestId });
      } else {
        Alert.alert("Erro do Servidor", backendResponse.message || "Não foi possível solicitar a corrida.");
      }
    } catch (error) {
      console.error("[ScheduleRideScreen] handleFindDriver: Erro ao tentar solicitar corrida (simulado):", error);
      Alert.alert("Erro de Comunicação", "Houve um problema ao tentar solicitar a corrida. Tente novamente.");
    } finally {
      setLoadingRoute(false);
    }
    // --- FIM DA LÓGICA FUTURA PARA O BACKEND ---
  };

  const onMapLayout = () => {
    console.log("[ScheduleRideScreen] onMapLayout: Mapa renderizado.");
    setMapReady(true);
  }

  if (!originPoint || !destinationPoint) {
    console.log("[ScheduleRideScreen] Renderizando tela de carregamento (origem/destino não prontos).");
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando dados da rota...</Text>
            </View>
        </SafeAreaView>
    );
  }

  console.log("[ScheduleRideScreen] --- PREPARANDO PARA RENDERIZAR MAPVIEW ---");
  console.log("[ScheduleRideScreen] originPoint para MapView:", JSON.stringify(originPoint, null, 2));
  console.log("[ScheduleRideScreen] destinationPoint para MapView:", JSON.stringify(destinationPoint, null, 2));
  console.log("[ScheduleRideScreen] routeCoords.length para Polyline:", routeCoords.length);

  return (
    <SafeAreaView style={styles.safeArea}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: originPoint.latitude,
          longitude: originPoint.longitude,
          latitudeDelta: Math.abs(originPoint.latitude - destinationPoint.latitude) * 2 + 0.02, // Ajuste dinâmico do delta
          longitudeDelta: Math.abs(originPoint.longitude - destinationPoint.longitude) * 2 + 0.02, // Ajuste dinâmico do delta
        }}
        onMapReady={() => console.log("[ScheduleRideScreen] Evento onMapReady disparado.")}
        onLayout={onMapLayout} // Usar onLayout para saber quando o mapa está dimensionalmente pronto
        key={mapReady ? "map-ready" : "map-loading"} // Forçar re-renderização se necessário
      >
        {console.log("[ScheduleRideScreen] Renderizando Marker de Origem")}
        <Marker
            coordinate={{ latitude: originPoint.latitude, longitude: originPoint.longitude }}
            title="Origem"
            description={originPoint.name}
        />
        {console.log("[ScheduleRideScreen] Renderizando Marker de Destino")}
        <Marker
            coordinate={{ latitude: destinationPoint.latitude, longitude: destinationPoint.longitude }}
            title="Destino"
            description={destinationPoint.name}
            pinColor="green"
        />
        {routeCoords && routeCoords.length > 0 && (
          <>
            {console.log("[ScheduleRideScreen] Renderizando Polyline com", routeCoords.length, "coordenadas.")}
            <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#007AFF" />
          </>
        )}
      </MapView>

      {loadingRoute && (
        <View style={styles.routeLoadingOverlay}>
            <ActivityIndicator size="small" color="#FFFFFF" />
            <Text style={styles.routeLoadingText}>Calculando rota...</Text>
        </View>
      )}

      <ScrollView style={styles.bottomSheet} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={styles.sectionTitle}>Quem vai na viagem?</Text>
        <View style={styles.childrenSelectionContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childrenScroll}>
            {MOCK_CHILDREN_DATA.map(child => (
              <TouchableOpacity
                key={child.id}
                style={[
                  styles.childCard,
                  selectedChildId === child.id && styles.childCardSelected,
                ]}
                onPress={() => {
                  console.log("[ScheduleRideScreen] Criança selecionada:", child.name, child.id);
                  setSelectedChildId(child.id);
                }}
              >
                <Image source={child.avatar} style={styles.childAvatar} />
                <Text style={styles.childName}>{child.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.addChildButton}
            onPress={() => {
              console.log("[ScheduleRideScreen] Botão Adicionar Criança pressionado.");
              Alert.alert("Nova Criança", "Funcionalidade para adicionar nova criança em desenvolvimento!");
            }}
          >
            <Ionicons name="add-circle-outline" size={36} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {estimatedPrice && !loadingRoute && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Preço Estimado:</Text>
            <Text style={styles.priceValue}>R$ {estimatedPrice}</Text>
          </View>
        )}

        <View style={styles.parentsContainer}>
          <Text style={styles.sectionTitle}>Pais vão acompanhar?</Text>
          <Switch
            value={parentsWillJoin}
            onValueChange={(value) => {
              console.log("[ScheduleRideScreen] Pais vão acompanhar alterado para:", value);
              setParentsWillJoin(value);
            }}
            thumbColor={parentsWillJoin ? '#007AFF' : '#ccc'}
            trackColor={{ true: '#A0D1FF', false: '#ccc' }}
          />
        </View>

        <TouchableOpacity style={styles.findDriverButton} onPress={handleFindDriver}>
          <Text style={styles.findDriverButtonText}>Buscar Motorista</Text>
        </TouchableOpacity>
      </ScrollView>
      {console.log("[ScheduleRideScreen] --- FIM DA RENDERIZAÇÃO DO COMPONENTE ---")}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' }, // Adicionado um fundo para a safeArea
  map: { flex: 1 },
  loadingContainer: { // Para o carregamento inicial de dados
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  routeLoadingOverlay: { // Para o loading da rota sobre o mapa
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeLoadingText: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: '#fff',
    width: '100%',
    maxHeight: '45%', // Limitar a altura máxima
    padding: 16,
    borderTopLeftRadius: 20, // Aumentado o raio
    borderTopRightRadius: 20, // Aumentado o raio
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: -3, // Sombra para cima
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 17, // Aumentado um pouco
    fontWeight: '600',
    marginBottom: 12, // Aumentado um pouco
    color: '#333',
  },
  childrenSelectionContainer: { // Novo container para a lista de crianças e o botão de adicionar
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  childrenScroll: {
    flexDirection: 'row',
    // marginBottom: 20, // Removido, pois o container pai agora tem a margem
  },
  childCard: {
    paddingVertical: 10, // Ajustado padding
    paddingHorizontal: 15, // Ajustado padding
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent', // Borda transparente por padrão
    alignItems: 'center', // Para centralizar o avatar e o nome
  },
  childCardSelected: {
    backgroundColor: '#E0EFFF',
    borderColor: '#007AFF',
  },
  childAvatar: {
    width: 50, // Tamanho do avatar
    height: 50, // Tamanho do avatar
    // borderRadius: 25, // Removido para deixar a imagem normal
    marginBottom: 8,
  },
  childName: {
    fontSize: 15, // Aumentado um pouco
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  priceLabel: { fontSize: 16, fontWeight: '500', color: '#333' },
  priceValue: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  addChildButton: {
    marginLeft: 10,
    padding: 5, // Pequeno padding para facilitar o toque
    justifyContent: 'center',
  },
  parentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25, // Aumentado um pouco
    paddingVertical: 10, // Adicionado padding vertical
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  findDriverButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15, // Aumentado um pouco
    borderRadius: 12, // Aumentado o raio
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  findDriverButtonText: {
    color: '#fff',
    fontSize: 17, // Aumentado um pouco
    fontWeight: 'bold',
  },
});

export default ScheduleRideScreen;
