import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard
} from 'react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { GOOGLE_PLACES_API_KEY } from '@env';

const SearchScreen = () => {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Pedir permissão e pegar localização atual
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Não foi possível acessar sua localização.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude
      });
    })();
  }, []);

  // 2. Buscar lugares com base na query
  const fetchSuggestions = async () => {
    if (!query || query.length < 3) return;

    setLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location?.lat},${location?.lng}&radius=5000&key=${GOOGLE_PLACES_API_KEY}&language=pt`;
      const res = await fetch(url);
      const json = await res.json();
      setSuggestions(json.results || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Erro ao buscar locais.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlace = (place) => {
    navigation.navigate('ScheduleRide', { // Nome da rota como definido no Navigator
      selectedPlaceDetails: place
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Para onde?</Text>
      <TextInput
        placeholder="Ex: Escola Almirante"
        style={styles.input}
        value={query}
        onChangeText={(text) => setQuery(text)}
        onSubmitEditing={fetchSuggestions}
        returnKeyType="search"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectPlace(item)}
              style={styles.item}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.formatted_address}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 10 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10
  },
  item: {
    paddingVertical: 12,
    borderBottomColor: '#eee',
    borderBottomWidth: 1
  },
  name: { fontSize: 16, fontWeight: 'bold' },
  address: { fontSize: 14, color: '#555' }
});

export default SearchScreen;
