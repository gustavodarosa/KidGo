import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { getDistance } from 'geolib';
import * as Crypto from 'expo-crypto'; // Para gerar session token
import { GOOGLE_PLACES_API_KEY } from '@env';

const SearchScreen = ({ navigation }) => {
    const [originText, setOriginText] = useState('');
    const [destinationText, setDestinationText] = useState('');
    const [activeField, setActiveField] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [selectedOrigin, setSelectedOrigin] = useState(null);
    const [selectedDestination, setSelectedDestination] = useState(null);
    const [googleSessionToken, setGoogleSessionToken] = useState(null);

    const originInputRef = useRef(null);
    const destinationInputRef = useRef(null);

    useEffect(() => {
        const generateSessionToken = () => { // Removido async
            const token = Crypto.randomUUID(); // Alterado para síncrono
            setGoogleSessionToken(token);
        };
        generateSessionToken(); // Chamada continua a mesma

        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permissão negada', 'Não foi possível obter sua localização para melhorar a busca.');
                return;
            }
            try {
                const loc = await Location.getCurrentPositionAsync({});
                setCurrentLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                });
            } catch (error) {
                console.error("Erro ao obter localização: ", error);
                Alert.alert('Erro de Localização', 'Não foi possível obter sua localização atual.');
            }
        })();
    }, []);

    const fetchAutocompleteSuggestions = useCallback(async (text, isOrigin) => {
        if (!text || text.length < 3) {
            setSuggestions([]);
            return;
        }

        setLoading(true);
        try {
            let autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_API_KEY}&language=pt&types=establishment`;

            if (currentLocation) {
                autocompleteUrl += `&location=${currentLocation.latitude},${currentLocation.longitude}&radius=20000`; // Raio de 20km
            }
            if (googleSessionToken) {
                autocompleteUrl += `&sessiontoken=${googleSessionToken}`;
            }

            console.log("URL de Autocomplete:", autocompleteUrl);
            const autocompleteResponse = await fetch(autocompleteUrl);
            const autocompleteData = await autocompleteResponse.json();
            console.log("Resposta do Autocomplete:", autocompleteData);

            if (autocompleteData.status === 'OK') {
                const suggestionsWithDetails = await Promise.all(
                    autocompleteData.predictions.map(async (prediction) => {
                        let distance = null;
                        let predictionCoords = null;

                        try {
                            // Usar a API de Geocoding para obter as coordenadas da sugestão
                            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?place_id=${prediction.place_id}&key=${GOOGLE_PLACES_API_KEY}&language=pt`;
                            console.log("URL de Geocoding para sugestão:", geocodeUrl);
                            const geocodeResponse = await fetch(geocodeUrl);
                            const geocodeData = await geocodeResponse.json();
                            console.log(`Geocoding para ${prediction.description}:`, geocodeData.status);


                            if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
                                const location = geocodeData.results[0].geometry.location;
                                predictionCoords = {
                                    latitude: location.lat,
                                    longitude: location.lng,
                                };

                                if (currentLocation) {
                                    distance = getDistance(
                                        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                                        predictionCoords
                                    ) / 1000; // Converter para km
                                }
                            } else {
                                console.warn(`Geocoding falhou para ${prediction.place_id}: ${geocodeData.status} - ${geocodeData.error_message || ''}`);
                            }
                        } catch (geoError) {
                            console.error(`Erro no Geocoding para ${prediction.place_id}:`, geoError);
                        }

                        return {
                            ...prediction,
                            distance, // pode ser null se o geocoding falhar ou currentLocation não estiver disponível
                            coords: predictionCoords // Salva as coordenadas obtidas
                        };
                    })
                );

                // Ordenar por distância (se disponível)
                setSuggestions(
                    suggestionsWithDetails.sort((a, b) => {
                        if (a.distance === null && b.distance === null) return 0;
                        if (a.distance === null) return 1; // Coloca nulos no final
                        if (b.distance === null) return -1; // Coloca nulos no final
                        return a.distance - b.distance;
                    })
                );

            } else {
                console.warn("Erro no Autocomplete:", autocompleteData.status, autocompleteData.error_message);
                setSuggestions([]);
                if (autocompleteData.status === 'REQUEST_DENIED') {
                    Alert.alert("Erro de API", "A chave da API do Google Places parece estar incorreta ou as APIs necessárias não estão habilitadas.");
                } else if (autocompleteData.status === 'ZERO_RESULTS') {
                    // Não é um erro, apenas não há resultados
                } else {
                    Alert.alert("Erro", `Não foi possível buscar sugestões: ${autocompleteData.error_message || autocompleteData.status}`);
                }
            }
        } catch (error) {
            console.error("Erro ao buscar sugestões de autocomplete:", error);
            Alert.alert('Erro de Rede', 'Falha ao buscar sugestões. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    }, [currentLocation, GOOGLE_PLACES_API_KEY, googleSessionToken]);

    useEffect(() => {
        const textToSearch = activeField === 'origin' ? originText : destinationText;
        const isOriginField = activeField === 'origin';

        // Limpar sugestões se o campo estiver vazio ou com menos de 3 caracteres
        if (!textToSearch || textToSearch.length < 3) {
            setSuggestions([]);
            return;
        }

        const timeout = setTimeout(() => {
            fetchAutocompleteSuggestions(textToSearch, isOriginField);
        }, 700); // Aumentei um pouco o debounce devido às chamadas extras
        return () => clearTimeout(timeout);
    }, [originText, destinationText, activeField, fetchAutocompleteSuggestions]);

    const getPlaceDetails = useCallback(async (placeId, placeName, placeAddress, placeCoords) => {
        // Se já temos as coordenadas da sugestão (obtidas pelo Geocoding no fetchAutocompleteSuggestions),
        // podemos usá-las diretamente em vez de chamar a API de Place Details novamente,
        // a menos que precisemos de mais informações que só Place Details fornece.
        // Por simplicidade e para garantir todos os dados, vamos continuar chamando Place Details.
        // Se a performance for crítica, pode-se otimizar aqui.

        setLoading(true);
        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_PLACES_API_KEY}&language=pt&fields=name,formatted_address,geometry,place_id&sessiontoken=${googleSessionToken}`;
            console.log("URL de Detalhes:", url);
            const response = await fetch(url);
            const data = await response.json();
            console.log("Resposta dos Detalhes:", data);

            if (data.status === 'OK' && data.result) {
                const details = data.result;
                const selectedPlace = {
                    id: details.place_id,
                    name: details.name,
                    address: details.formatted_address,
                    coords: {
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                    },
                    // details: details // Se precisar de todos os detalhes
                };

                if (activeField === 'origin') {
                    setSelectedOrigin(selectedPlace);
                    setOriginText(selectedPlace.name); // Atualiza o texto do input com o nome completo
                    setActiveField('destination'); // Muda o foco para o campo de destino
                    destinationInputRef.current?.focus();
                } else if (activeField === 'destination') {
                    setSelectedDestination(selectedPlace);
                    setDestinationText(selectedPlace.name); // Atualiza o texto do input
                    setActiveField(null); // Limpa o campo ativo
                    Keyboard.dismiss(); // Fecha o teclado
                }
                setSuggestions([]); // Limpar sugestões após a seleção
                // Gerar um novo token de sessão para a próxima "sessão" de busca do Google.
                // Isso é importante para o faturamento do Google Places API.
                const newToken = Crypto.randomUUID(); // Alterado para síncrono
                setGoogleSessionToken(newToken); // Removido await

            } else {
                Alert.alert('Erro', `Falha ao obter detalhes do local: ${data.error_message || data.status}`);
            }
        } catch (error) {
            console.error("Erro ao obter detalhes do local:", error);
            Alert.alert('Erro de Rede', 'Falha ao obter detalhes do local. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    }, [GOOGLE_PLACES_API_KEY, googleSessionToken, activeField]);

    const handleSelectSuggestion = useCallback((prediction) => {
        console.log("Sugestão selecionada:", prediction);
        // Passamos as coordenadas já obtidas (se houver) para getPlaceDetails,
        // embora atualmente getPlaceDetails ainda faça a chamada para a API de Details.
        getPlaceDetails(prediction.place_id, prediction.structured_formatting?.main_text, prediction.structured_formatting?.secondary_text, prediction.coords);
    }, [getPlaceDetails]);

    const handleConfirm = () => {
        if (!selectedOrigin || !selectedDestination) {
            Alert.alert('Atenção', 'Selecione origem e destino válidos.');
            return;
        }
        if (!selectedOrigin.coords || !selectedDestination.coords) {
            Alert.alert('Erro', 'Coordenadas de origem ou destino não encontradas. Tente selecionar novamente.');
            return;
        }

        console.log("Confirmando rota com:", { selectedOrigin, selectedDestination });
        // Navega para ScheduleRideScreen, passando os detalhes do destino selecionado
        // E também os detalhes da origem, caso sejam necessários lá.
        navigation.navigate('ScheduleRide', {
            // selectedPlaceDetails é usado em ScheduleRideScreen para o destino
            selectedPlaceDetails: {
                name: selectedDestination.name,
                formatted_address: selectedDestination.address,
                geometry: { location: selectedDestination.coords }
            },
            // Poderíamos passar a origem também, se necessário
            originDetails: {
                name: selectedOrigin.name,
                formatted_address: selectedOrigin.address,
                geometry: { location: selectedOrigin.coords }
            }
        });
    };

    const renderSuggestionItem = useCallback(({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => handleSelectSuggestion(item)}
        >
            <Ionicons name="location-outline" size={20} color="#333" style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.structured_formatting?.main_text || item.description}</Text>
                <Text style={styles.address} numberOfLines={1}>{item.structured_formatting?.secondary_text}</Text>
            </View>
            {item.distance !== null && (
                <Text style={styles.distance}>({item.distance.toFixed(1)} km)</Text>
            )}
        </TouchableOpacity>
    ), [handleSelectSuggestion]);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Escolha Origem e Destino</Text>

            <Text style={styles.label}>De onde?</Text>
            <TextInput
                ref={originInputRef}
                style={styles.input}
                value={originText}
                onFocus={() => {
                    setActiveField('origin');
                    if (originText.length >=3 && suggestions.length === 0 && !loading) {
                        fetchAutocompleteSuggestions(originText, true);
                    }
                }}
                onChangeText={(text) => {
                    setOriginText(text);
                    setSelectedOrigin(null); // Limpa seleção anterior se o texto mudar
                    if (text.length < 3) setSuggestions([]);
                }}
                placeholder="Digite o endereço de origem"
                placeholderTextColor="#888"
            />

            <Text style={styles.label}>Para onde?</Text>
            <TextInput
                ref={destinationInputRef}
                style={styles.input}
                value={destinationText}
                onFocus={() => {
                    setActiveField('destination');
                     if (destinationText.length >=3 && suggestions.length === 0 && !loading) {
                        fetchAutocompleteSuggestions(destinationText, false);
                    }
                }}
                onChangeText={(text) => {
                    setDestinationText(text);
                    setSelectedDestination(null); // Limpa seleção anterior se o texto mudar
                    if (text.length < 3) setSuggestions([]);
                }}
                placeholder="Digite o endereço de destino"
                placeholderTextColor="#888"
            />

            {loading && <ActivityIndicator style={{ marginVertical: 10 }} size="large" color="#007AFF" />}

            {suggestions.length > 0 && activeField && (
                <FlatList
                    data={suggestions}
                    keyExtractor={(item) => item.place_id}
                    renderItem={renderSuggestionItem}
                    keyboardShouldPersistTaps="handled"
                    style={styles.suggestionsList}
                />
            )}

            {selectedOrigin && selectedDestination && !loading && (
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>Confirmar Rota</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f4f4f4' },
    title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
    label: { fontSize: 16, marginTop: 12, marginBottom: 6, fontWeight: '500', color: '#333' },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: 'white',
        marginBottom: 5,
        color: '#333',
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
    },
    name: { fontWeight: 'bold', fontSize: 16, color: '#333', flexShrink: 1 }, // flexShrink para evitar que empurre a distância
    address: { fontSize: 14, color: '#555', flexShrink: 1 }, // flexShrink
    distance: { fontSize: 14, color: '#007AFF', marginLeft: 8, fontWeight: '500' },
    confirmButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
    suggestionsList: {
        maxHeight: 280, // Aumentei um pouco a altura máxima
        borderWidth: 1,
        borderColor: '#ddd', // Cor da borda um pouco mais escura
        borderRadius: 8,
        marginTop: 5,
        backgroundColor: 'white', // Garante fundo branco para a lista
    }
});

export default SearchScreen;
