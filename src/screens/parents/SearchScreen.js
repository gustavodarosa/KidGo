import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';
import { GOOGLE_PLACES_API_KEY } from '@env';

// --- Funções de Distância (Haversine) ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distância em km
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
// --- Fim das Funções de Distância ---

const SearchScreen = () => {
    console.log("[SearchScreen] COMPONENTE MONTADO / RENDERIZADO");
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [googleSessionToken, setGoogleSessionToken] = useState(null);
    
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [locationError, setLocationError] = useState(null);

    console.log(`[SearchScreen] Estado inicial: searchText="${searchText}", suggestions.length=${suggestions.length}, currentLocation=${JSON.stringify(currentLocation)}, googleSessionToken=${googleSessionToken}, isLoadingLocation=${isLoadingLocation}, isFetchingSuggestions=${isFetchingSuggestions}, locationError=${locationError}`);

    // Mover requestLocation para o escopo do componente e usar useCallback
    const requestLocation = useCallback(async () => {
        console.log("[EFFECT_LOCATION] Iniciando obtenção de localização...");
        setIsLoadingLocation(true);
        setLocationError(null);
        setCurrentLocation(null);

        try {
            console.log("[EFFECT_LOCATION] Solicitando permissão de localização...");
            let permissionResult = await Location.requestForegroundPermissionsAsync();
            console.log("[EFFECT_LOCATION] Resposta da permissão:", permissionResult);
            const status = permissionResult.status;

            if (status !== 'granted') {
                console.warn("[EFFECT_LOCATION] Permissão de localização NÃO concedida.");
                setLocationError("Permissão de localização negada. As sugestões podem ser menos precisas. Você pode ativar nas configurações.");
                setIsLoadingLocation(false);
                return;
            }

            console.log("[EFFECT_LOCATION] Permissão concedida. Verificando se os serviços de localização estão ativos...");
            const servicesEnabled = await Location.hasServicesEnabledAsync();
            console.log("[EFFECT_LOCATION] Serviços de localização ativos:", servicesEnabled);

            if (!servicesEnabled) {
                console.warn("[EFFECT_LOCATION] Serviços de localização estão DESATIVADOS no dispositivo.");
                setLocationError("Os serviços de localização estão desativados. Por favor, ative-os nas configurações do seu dispositivo.");
                setIsLoadingLocation(false);
                setCurrentLocation(null);
                return;
            }

            console.log("[EFFECT_LOCATION] Serviços ativos. Tentando obter posição atual (com timeout wrapper de 20s)...");

            const positionPromiseWithTimeout = new Promise(async (resolve, reject) => {
                const timer = setTimeout(() => {
                    console.error("[EFFECT_LOCATION] Timeout manual de 20s atingido para getCurrentPositionAsync.");
                    reject(new Error("Timeout: Location request timed out after 20 seconds."));
                }, 20000);

                try {
                    const locData = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    clearTimeout(timer);
                    console.log("[EFFECT_LOCATION] getCurrentPositionAsync (dentro do wrapper) RESOLVIDA.");
                    resolve(locData);
                } catch (e) {
                    clearTimeout(timer);
                    console.error("[EFFECT_LOCATION] getCurrentPositionAsync (dentro do wrapper) REJEITADA ou com ERRO:", e);
                    reject(e);
                }
            });

            const location = await positionPromiseWithTimeout;
            
            console.log("[EFFECT_LOCATION] getCurrentPositionAsync RESOLVIDA. Posição obtida:", location);
            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
            console.log("[EFFECT_LOCATION] State currentLocation ATUALIZADO para:", {latitude: location.coords.latitude, longitude: location.coords.longitude });
            setLocationError(null);
        } catch (error) {
            console.error("[EFFECT_LOCATION] ERRO DETALHADO ao obter localização:", error);
            console.error("[EFFECT_LOCATION] Erro name:", error.name);
            console.error("[EFFECT_LOCATION] Erro message:", error.message);
            console.error("[EFFECT_LOCATION] Erro code (se houver):", error.code);

            let errorMessage = "Não foi possível obter sua localização. Verifique os serviços de GPS e as permissões.";
            if (error.message && error.message.includes("Timeout")) {
                errorMessage = "Tempo esgotado ao tentar obter sua localização. Tente novamente. (Pode ser um problema com o emulador)";
            } else if (error.message && error.message.includes("Location services are disabled")) {
                errorMessage = "Os serviços de localização estão desativados no seu dispositivo.";
            }
            setLocationError(errorMessage);
            setCurrentLocation(null);
        } finally {
            setIsLoadingLocation(false);
            console.log("[EFFECT_LOCATION] Finalizada tentativa de obtenção de localização. isLoadingLocation:", false);
        }
    }, []);

    // 1. Obter Localização na Montagem da Tela
    useEffect(() => {
        requestLocation();
    }, [requestLocation]);

    // Gerar session_token na montagem
    useEffect(() => {
        const newSessionToken = Crypto.randomUUID();
        setGoogleSessionToken(newSessionToken);
        console.log("[SearchScreen][EFFECT_SESSION_TOKEN] Google Places session token gerado:", newSessionToken);
    }, []);

    // 2. Buscar Sugestões quando searchText ou currentLocation mudar (com debounce)
    const fetchGooglePlacesSuggestions = useCallback(async (textToSearch, locationToUse, currentGoogleSessionToken) => {
        console.log(`[SearchScreen][fetchGooglePlacesSuggestions] Iniciando. textToSearch="${textToSearch}", locationToUse=${JSON.stringify(locationToUse)}, currentGoogleSessionToken=${currentGoogleSessionToken}`);
        if (!textToSearch || textToSearch.length < 3 || !currentGoogleSessionToken) {
            console.log("[SearchScreen][fetchGooglePlacesSuggestions] Condições não atendidas (texto curto ou sem token). Limpando sugestões.");
            setSuggestions([]);
            return;
        }

        console.log(`[API_GOOGLE_PLACES] Iniciando busca por: "${textToSearch}". Usando session token: ${currentGoogleSessionToken}`);
        setIsFetchingSuggestions(true);
        

        try {
            if (!GOOGLE_PLACES_API_KEY) {
                console.error("[API_GOOGLE_PLACES] ERRO FATAL: Chave da API Google Places não configurada no .env!");
                Alert.alert("Erro de Configuração", "O serviço de busca (Google) não está configurado corretamente.");
                setSuggestions([]);
                setIsFetchingSuggestions(false);
                return;
            }

            let locationParamsForTextSearch = '';
            if (locationToUse) {
                locationParamsForTextSearch = `&location=${locationToUse.latitude},${locationToUse.longitude}&radius=8000`;
                console.log(`[API_GOOGLE_PLACES_TEXT_SEARCH] Parâmetros de localização (raio 8km): ${locationParamsForTextSearch}`);
            }

            let url;
            url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textToSearch)}&key=${GOOGLE_PLACES_API_KEY}&language=pt${locationParamsForTextSearch}`;
            
            console.log("[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] URL da requisição:", url);

            const response = await fetch(url);
            console.log(`[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] Resposta da API - Status: ${response.status}, OK: ${response.ok}`);

            const data = await response.json();
            console.log("[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] Dados brutos da API (Text Search):", JSON.stringify(data, null, 2));

            if (data.results && data.status === 'OK') {
                console.log(`[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] ${data.results.length} resultados encontrados. Mapeando...`);
                
                const processedSuggestions = data.results.map(result => {
                    console.log(`[SearchScreen][fetchGooglePlacesSuggestions] Processando resultado: ${result.name}`);
                    let distance = null;
                    let placeTypes = result.types || [];

                    if (result.geometry?.location) {
                        const { lat, lng } = result.geometry.location;
                        if (locationToUse) {
                            distance = getDistance(
                                locationToUse.latitude,
                                locationToUse.longitude,
                                lat,
                                lng
                            );
                            console.log(`[SearchScreen][DISTANCE_CALC] Distância para "${result.name}": ${distance?.toFixed(2)} km`);
                        }
                    } else {
                        console.warn(`[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] Geometria não encontrada para place_id: ${result.place_id}, Nome: ${result.name}`);
                    }

                    return {
                        id: result.place_id,
                        name: result.name,
                        address: result.formatted_address || '',
                        description: result.name,
                        details: result,
                        distance: distance,
                        placeTypes: placeTypes,
                    };
                }).sort((a, b) => {
                    if (a.distance === null && b.distance === null) {
                        return 0;
                    }
                    if (a.distance === null) {
                        return 1;
                    }
                    if (b.distance === null) {
                        return -1;
                    }
                    return a.distance - b.distance;
                });

                setSuggestions(processedSuggestions);
                console.log("[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] Sugestões processadas e ordenadas por distância:", processedSuggestions.length);
            } else {
                console.warn(`[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] Nenhuma predição encontrada ou status não OK. Status: ${data.status}, Error: ${data.error_message}`);
                setSuggestions([]);
            }
        } catch (error) {
            console.error('[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] ERRO ao buscar ou processar sugestões:', error);
            Alert.alert("Erro na Busca", "Ocorreu um erro ao buscar sugestões (Google). Verifique sua conexão e tente novamente.");
            setSuggestions([]);
        } finally {
            setIsFetchingSuggestions(false);
            console.log("[SearchScreen][API_GOOGLE_PLACES_TEXT_SEARCH] Finalizada tentativa de busca de sugestões. isFetchingSuggestions:", false);
        }
    }, [GOOGLE_PLACES_API_KEY, getDistance]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            console.log(`[SearchScreen][EFFECT_SEARCH] Verificando condições para busca: isLoadingLocation=${isLoadingLocation}, searchText.length=${searchText.length}`);
            if (searchText.length <= 2) {
                console.log("[SearchScreen][EFFECT_SEARCH] Texto muito curto ou ainda carregando localização. Limpando sugestões.");
                setSuggestions([]);
                return;
            }

            if (!isLoadingLocation) {
                console.log(`[SearchScreen][EFFECT_SEARCH] Condições atendidas. Usando termo de busca original: "${searchText}"`);
                fetchGooglePlacesSuggestions(searchText, currentLocation, googleSessionToken);
            }
        }, 500);
        console.log(`[SearchScreen][EFFECT_SEARCH] Debounce timer configurado para searchText: "${searchText}"`);
        return () => {
            console.log(`[SearchScreen][EFFECT_SEARCH] Limpando debounce timer para searchText: "${searchText}"`);
            clearTimeout(debounceTimer);
        }
    }, [searchText, currentLocation, isLoadingLocation, googleSessionToken, fetchGooglePlacesSuggestions]);


    // 3. Renderizar Itens da Lista
    const renderSuggestionItem = ({ item }) => (
        <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => {
                console.log("[SearchScreen][ITEM_PRESS] Sugestão selecionada (objeto 'item' completo):", JSON.stringify(item, null, 2));
                
                const placeDetailsToPass = item.details;
                console.log("[SearchScreen][ITEM_PRESS] 'item.details' que será passado como 'selectedPlaceDetails':", JSON.stringify(placeDetailsToPass, null, 2));

                if (!placeDetailsToPass || (typeof placeDetailsToPass === 'object' && Object.keys(placeDetailsToPass).length === 0)) {
                    console.error("[SearchScreen][ITEM_PRESS] ERRO: 'item.details' está vazio ou inválido. Não navegando.");
                    Alert.alert("Erro Interno", "Não foi possível obter os detalhes do local. Tente novamente.");
                    return;
                }

                navigation.navigate('ScheduleRide', {
                    selectedPlaceDetails: placeDetailsToPass
                });
            }}
        >
            {/* Container para Ícone e Distância (à esquerda) */}
            <View style={styles.leftInfoContainer}>
                {/* Ícone agora à esquerda da distância */}
                <Ionicons name="location-outline" size={18} color="#8E8E93" style={styles.locationIconLeft} />
                {typeof item.distance === 'number' && !isNaN(item.distance) && (
                    <Text style={styles.distanceTextLeft}>
                        {item.distance < 1 ? `${Math.round(item.distance * 1000)} m` : `${item.distance.toFixed(1)} km`}
                    </Text>
                )}
            </View>

            {/* Descrição do Local (ocupa o restante do espaço) */}
            <View style={styles.descriptionWrapper}>
                <Text style={styles.descriptionTextMain} numberOfLines={1}>{item.name}</Text>
                {item.address ? <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text> : null}
            </View>
        </TouchableOpacity>
    );

    // 4. Renderizar Conteúdo Principal e Placeholders
    const renderContent = () => {
        let renderState = "Desconhecido";
        if (locationError && !searchText) {
            renderState = "locationError (sem busca ativa)";
            return (
                <View style={styles.placeholderContainer}>
                    <Ionicons name="warning-outline" size={40} color="orange" />
                    <Text style={[styles.placeholderText, { color: 'orange'}]}>{locationError}</Text>
                    <TouchableOpacity onPress={() => { console.log("[SearchScreen][renderContent] Botão 'Tentar Novamente' (erro de localização) pressionado."); requestLocation(); }} style={styles.retryButton}>
                        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        if (isLoadingLocation) {
            renderState = "isLoadingLocation";
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.placeholderText}>Obtendo sua localização...</Text>
                </View>
            );
        }
        if (searchText.length > 2 && isFetchingSuggestions) {
            renderState = "isFetchingSuggestions";
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.placeholderText}>Buscando sugestões...</Text>
                </View>
            );
        }

        if (searchText.length > 2 && suggestions.length === 0 && !isFetchingSuggestions) {
            renderState = "Nenhuma sugestão encontrada";
            return (
                <View style={styles.placeholderContainer}>
                    <Ionicons name="search-outline" size={40} color="gray" />
                    <Text style={styles.placeholderText}>Nenhuma sugestão encontrada para "{searchText}".</Text>
                    {locationError && <Text style={[styles.placeholderText, {fontSize: 12, marginTop: 5}]}>({locationError})</Text>}
                </View>
            );
        }
        
        if (suggestions.length > 0) {
            renderState = "Lista de sugestões";
            return (
                <FlatList
                    data={suggestions}
                    renderItem={renderSuggestionItem}
                    keyExtractor={(item) => item.id}
                    keyboardShouldPersistTaps="handled"
                    style={styles.list}
                />
            );
        }

        renderState = "Placeholder inicial/texto curto";
        console.log(`[SearchScreen][renderContent] Renderizando: ${renderState}`);
        return (
            <View style={styles.placeholderContainer}>
                <Ionicons name="map-outline" size={40} color="lightgray" />
                <Text style={styles.placeholderText}>Digite um endereço ou nome de local.</Text>
                {locationError && <Text style={[styles.placeholderText, {fontSize: 12, marginTop: 5}]}>Aviso: {locationError}</Text>}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        console.log("[SearchScreen] Botão 'Voltar' no header pressionado.");
                        navigation.goBack();
                    }}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={28} color="#007AFF" />
                </TouchableOpacity>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Para onde vamos?"
                    value={searchText}
                    onChangeText={(text) => {
                        setSearchText(text);
                    }}
                    autoFocus={true}
                    placeholderTextColor="#8e8e93"
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => { console.log("[SearchScreen] Botão 'Limpar Texto' pressionado."); setSearchText(''); }} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={22} color="#8e8e93" />
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.contentContainer}>
                {renderContent()}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9F9F9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: 'white',
    },
    backButton: {
        padding: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 17,
        marginLeft: 8,
        color: '#000',
    },
    clearButton: {
        padding: 8,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
    },
    list: {
        marginTop: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#EDEDED',
    },
    leftInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    distanceTextLeft: {
        fontSize: 14,
        color: '#8E8E93',
    },
    locationIconLeft: {
        marginRight: 4,
    },
    descriptionWrapper: {
        flex: 1,
    },
    descriptionTextMain: {
        fontSize: 16,
        color: '#333',
    },
    addressText: {
        fontSize: 14,
        color: '#8E8E93',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderText: {
        color: '#8E8E93',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 10,
    },
    retryButton: {
        marginTop: 20,
        backgroundColor: '#007AFF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default SearchScreen;
