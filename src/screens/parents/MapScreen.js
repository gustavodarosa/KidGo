import React, { useState, useEffect, useRef } from 'react';
 import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
 import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps'; // Adicionado UrlTile
 import { useRoute } from '@react-navigation/native';

 const MapScreen = () => {
  console.log("[MapScreen] --- INÍCIO DA RENDERIZAÇÃO DO COMPONENTE ---");
  const route = useRoute();
  const { origin, destination } = route.params || {};
  const mapRef = useRef(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [error, setError] = useState(null);

  console.log("[MapScreen] Props recebidas:", JSON.stringify(route.params, null, 2));

  // Efeito para ajustar o mapa e buscar a rota
  useEffect(() => {
   console.log("[MapScreen] --- INÍCIO DO useEffect ---");
   if (origin && destination && origin.latitude && origin.longitude && destination.latitude && destination.longitude) {
    setError(null);
    console.log("[MapScreen] Origem e Destino válidos. Iniciando fitToCoordinates e fetchRoute.");
    const fitMap = setTimeout(() => {
     if (mapRef.current) {
        console.log("[MapScreen] mapRef.current existe. Chamando fitToCoordinates.");
        mapRef.current.fitToCoordinates([
          { latitude: origin.latitude, longitude: origin.longitude },
          { latitude: destination.latitude, longitude: destination.longitude },
        ], {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      } else {
        console.warn("[MapScreen] mapRef.current ainda é null após o timeout. O mapa pode não ter sido inicializado a tempo.");
      }
    }, 1000);

    const fetchRoute = async () => {
     console.log("[MapScreen] fetchRoute: Iniciando busca da rota.");
     setIsLoadingRoute(true);
     setRouteCoordinates([]);

     const originCoords = `${origin.longitude},${origin.latitude}`;
     const destinationCoords = `${destination.longitude},${destination.latitude}`;
     const url = `http://router.project-osrm.org/route/v1/driving/${originCoords};${destinationCoords}?overview=full&geometries=geojson`;
     console.log("[MapScreen] fetchRoute: URL do OSRM:", url);

     try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("[MapScreen] fetchRoute: Resposta do OSRM:", JSON.stringify(data, null, 2).substring(0, 500) + "...");

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
       const coordinates = data.routes[0].geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0],
       }));
       setRouteCoordinates(coordinates);
       console.log(`[MapScreen] fetchRoute: Rota encontrada com ${coordinates.length} pontos.`);
      } else {
       console.warn("[MapScreen] fetchRoute: Nenhuma rota encontrada ou erro na resposta. Status:", data.code, "Mensagem:", data.message);
       setRouteCoordinates([]);
       setError(data.message || "Nenhuma rota encontrada pelo OSRM.");
      }
     } catch (error) {
      console.error("[MapScreen] fetchRoute: Erro ao obter rota:", error);
      setError("Erro de rede ao buscar rota. Verifique sua conexão.");
      setRouteCoordinates([]);
     } finally {
      setIsLoadingRoute(false);
      console.log("[MapScreen] fetchRoute: Finalizada.");
     }
    };

    fetchRoute();
    return () => clearTimeout(fitMap);
   } else {
    console.warn("[MapScreen] Origem ou destino inválidos ou faltando coordenadas:", { origin, destination });
    setError("Dados de origem ou destino incompletos para exibir o mapa.");
   }
   console.log("[MapScreen] --- FIM DO useEffect ---");
  }, [origin, destination]);


  const initialMapRegion = origin && origin.latitude && origin.longitude ? {
    latitude: origin.latitude,
    longitude: origin.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: -23.550520,
    longitude: -46.633308,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  // Renderiza uma tela de erro se os dados iniciais forem inválidos
  if (error && (!origin || !destination)) {
    console.log("[MapScreen] Renderizando tela de erro devido a dados de origem/destino inválidos.");
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Erro ao carregar o mapa:</Text>
        <Text style={styles.errorTextDetail}>{error}</Text>
      </View>
    );
  }

  console.log("[MapScreen] --- PREPARANDO PARA RENDERIZAR MAPVIEW ---");
  return (
   <View style={styles.container}>
    <MapView
     ref={mapRef}
     style={styles.map}
     initialRegion={initialMapRegion}
     onMapReady={() => console.log("[MapScreen] Evento onMapReady disparado.")}
     onLayout={() => console.log("[MapScreen] Evento onLayout do MapView disparado.")}
     onError={(errorEvent) => console.error("[MapScreen] MapView onError:", errorEvent.nativeEvent?.error || errorEvent)} // Adicionado log de erro do MapView
    >
      {/* Adicionando a camada de tiles do OpenStreetMap */}
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19} // Nível máximo de zoom para os tiles do OSM
        tileSize={256}
        zIndex={-1} // Tenta colocar abaixo de outros elementos como Markers/Polyline, se necessário
        onError={(errorEvent) => console.error("[MapScreen] UrlTile onError:", errorEvent.nativeEvent?.error || errorEvent)}
        shouldReplaceMapContent={true} // No Android, isso pode ajudar a garantir que os tiles do OSM substituam os do Google Maps (útil se não usar provider={null})
      />

     {origin && origin.latitude && origin.longitude && (
      <Marker
       coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
       title="Origem"
       description={origin.name || "Ponto de Partida"}
      />
     )}
     {destination && destination.latitude && destination.longitude && (
      <Marker
       coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
       title="Destino"
       description={destination.name || "Ponto de Chegada"}
       pinColor="green"
      />
     )}
     {routeCoordinates.length > 0 && (
      <Polyline
       coordinates={routeCoordinates}
       strokeColor="#007AFF"
       strokeWidth={6}
      />
     )}
    </MapView>
    {/* Adicionado um texto simples para verificar se o container principal está visível */}
    {isLoadingRoute && (
     <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Calculando rota...</Text>
     </View>
    )}
    {error && routeCoordinates.length === 0 && ( // Mostra erro se a rota não puder ser carregada E NÃO for o erro inicial de falta de dados
        <View style={styles.routeErrorContainer}>
            <Text style={styles.routeErrorText}>Não foi possível calcular a rota:</Text>
            <Text style={styles.routeErrorTextDetail}>{error}</Text>
        </View>
    )}
    <Text style={styles.debugOverlayText}>Status: {isLoadingRoute ? 'Buscando Rota...' : error ? `Erro: ${error.substring(0,30)}...` : routeCoordinates.length > 0 ? 'Rota Encontrada' : 'Aguardando Dados...'}</Text>
    {console.log("[MapScreen] --- FIM DA RENDERIZAÇÃO DO COMPONENTE ---")}
   </View>
  );
 };

 const styles = StyleSheet.create({
  container: {
   flex: 1,
   backgroundColor: '#f0f0f0', // Cor de fundo para ver se o MapView não está renderizando
  },
  map: {
   flex: 1,
  },
  loadingContainer: {
   ...StyleSheet.absoluteFillObject,
   justifyContent: 'center',
   alignItems: 'center',
   backgroundColor: 'rgba(0,0,0,0.2)',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorContainer: { // Para erros críticos que impedem o mapa de carregar
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
  },
  errorTextDetail: {
    fontSize: 14,
    color: 'grey',
    textAlign: 'center',
    marginTop: 10,
  },
  routeErrorContainer: { // Para erros específicos do cálculo de rota, sobre o mapa
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  routeErrorText: {
    color: 'white',
    fontWeight: 'bold',
  },
  routeErrorTextDetail: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  debugOverlayText: { // Estilo para o texto de debug
    position: 'absolute',
    top: 50, // Ajuste a posição conforme necessário
    left: 0,
    right: 0,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 0, 0.7)', // Fundo amarelo semi-transparente
    padding: 5,
    zIndex: 1000, // Garante que fique por cima
    fontSize: 12,
  }
 });

 export default MapScreen;
