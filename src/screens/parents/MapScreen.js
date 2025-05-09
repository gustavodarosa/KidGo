import React, { useState, useEffect, useRef } from 'react';
 import { View, StyleSheet, ActivityIndicator } from 'react-native';
 import MapView, { Marker, Polyline } from 'react-native-maps';
 import { useRoute } from '@react-navigation/native';

 const MapScreen = () => {
  const route = useRoute();
  const { origin, destination } = route.params;
  const mapRef = useRef(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);

  useEffect(() => {
   if (origin && destination) {
    // Ajuste a câmera para mostrar ambos os pontos
    setTimeout(() => {
     mapRef.current?.fitToCoordinates([
      { latitude: origin.latitude, longitude: origin.longitude },
      { latitude: destination.latitude, longitude: destination.longitude },
     ], {
      edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
      animated: true,
     });
    }, 500); // Pequeno delay para garantir que o mapa esteja carregado

    // Obter a rota usando OSRM
    const fetchRoute = async () => {
     setIsLoadingRoute(true);
     const originCoords = `<span class="math-inline">\{origin\.longitude\},</span>{origin.latitude}`;
     const destinationCoords = `<span class="math-inline">\{destination\.longitude\},</span>{destination.latitude}`;
     const url = `http://router.project-osrm.org/route/v1/driving/<span class="math-inline">\{originCoords\};</span>{destinationCoords}?overview=full&geometries=geojson`;

     try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
       const coordinates = data.routes[0].geometry.coordinates.map(coord => ({
        latitude: coord[1],
        longitude: coord[0],
       }));
       setRouteCoordinates(coordinates);
      } else {
       console.warn("Nenhuma rota encontrada.");
       setRouteCoordinates([]);
      }
     } catch (error) {
      console.error("Erro ao obter rota:", error);
      // Lidar com o erro de forma apropriada
     } finally {
      setIsLoadingRoute(false);
     }
    };

    fetchRoute();
   }
  }, [origin, destination]);

  return (
   <View style={styles.container}>
    <MapView
     ref={mapRef}
     style={styles.map}
     initialRegion={origin ? {
      latitude: origin.latitude,
      longitude: origin.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
     } : null}
    >
     {origin && (
      <Marker
       coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
       title="Origem"
       description={origin.name}
      />
     )}
     {destination && (
      <Marker
       coordinate={{ latitude: destination.latitude, longitude: destination.longitude }}
       title="Destino"
       description={destination.name}
       pinColor="green"
      />
     )}
     {routeCoordinates.length > 0 && (
      <Polyline
       coordinates={routeCoordinates}
       strokeColor="#007AFF"
       strokeWidth={5}
      />
     )}
    </MapView>
    {isLoadingRoute && (
     <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
     </View>
    )}
   </View>
  );
 };

 const styles = StyleSheet.create({
  container: {
   flex: 1,
  },
  map: {
   flex: 1,
  },
  loadingContainer: {
   ...StyleSheet.absoluteFillObject,
   justifyContent: 'center',
   alignItems: 'center',
   backgroundColor: 'rgba(0,0,0,0.1)',
  },
 });

 export default MapScreen;