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
    Alert, // Para mensagens mais proeminentes
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { MAPBOX_ACCESS_TOKEN } from '@env';

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
    const navigation = useNavigation();
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    
    const [isLoadingLocation, setIsLoadingLocation] = useState(true); // Novo estado para loading da localização
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [locationError, setLocationError] = useState(null); // Novo estado para erros de localização

    // Mover requestLocation para o escopo do componente e usar useCallback
    const requestLocation = useCallback(async () => {
        console.log("[EFFECT_LOCATION] Iniciando obtenção de localização...");
        setIsLoadingLocation(true);
        setLocationError(null);
        setCurrentLocation(null); // Reseta localização anterior

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
            if (error.message && error.message.includes("Timeout")) { // Adicionar verificação se error.message existe
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
    }, []); // useCallback com array de dependências vazio, pois não depende de props ou estado externo para sua definição

    // 1. Obter Localização na Montagem da Tela
    useEffect(() => {
        requestLocation();
    }, [requestLocation]); // Adicionar requestLocation como dependência

    // 2. Buscar Sugestões quando searchText ou currentLocation mudar (com debounce)
    const fetchMapboxSuggestions = useCallback(async (textToSearch, locationToUse) => {
        if (!textToSearch || textToSearch.length < 3) {
            setSuggestions([]);
            return;
        }

        console.log(`[API_MAPBOX] Iniciando busca por: "${textToSearch}". Usando localização:`, locationToUse);
        setIsFetchingSuggestions(true);
        let proximityParam = '';
        if (locationToUse) {
            proximityParam = `&proximity=${locationToUse.longitude},${locationToUse.latitude}`;
            console.log(`[API_MAPBOX] Parâmetro de proximidade: ${proximityParam}`);
        }

        try {
            if (!MAPBOX_ACCESS_TOKEN) {
                console.error("[API_MAPBOX] ERRO FATAL: Token do Mapbox não configurado no .env!");
                Alert.alert("Erro de Configuração", "O serviço de busca não está configurado corretamente.");
                setSuggestions([]);
                setIsFetchingSuggestions(false);
                return;
            }

            const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(textToSearch)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=BR&types=poi,address,place,locality${proximityParam}&autocomplete=true`;
            console.log("[API_MAPBOX] URL da requisição:", url);

            const response = await fetch(url);
            console.log(`[API_MAPBOX] Resposta da API - Status: ${response.status}, OK: ${response.ok}`);

            const data = await response.json();
            console.log("[API_MAPBOX] Dados brutos da API:", JSON.stringify(data, null, 2)); // Loga o JSON completo formatado

            if (data.features && data.features.length > 0) {
                console.log(`[API_MAPBOX] ${data.features.length} features encontradas. Mapeando e calculando distâncias...`);
                const suggestionsWithDistance = data.features.map(feature => {
                    let distance = null;
                    if (locationToUse && feature.center && typeof feature.center[0] === 'number' && typeof feature.center[1] === 'number') {
                        distance = getDistance(
                            locationToUse.latitude,
                            locationToUse.longitude,
                            feature.center[1], // latitude
                            feature.center[0]  // longitude
                        );
                    }
                    return { 
                        id: feature.id, 
                        description: feature.place_name, 
                        details: feature,
                        distance: distance 
                    };
                }).sort((a, b) => { // Ordena aqui mesmo se locationToUse for null (nulos no final)
                    if (a.distance === null && b.distance === null) return 0;
                    if (a.distance === null) return 1; 
                    if (b.distance === null) return -1;
                    return a.distance - b.distance;
                });
                setSuggestions(suggestionsWithDistance);
                console.log("[API_MAPBOX] Sugestões processadas e ordenadas:", suggestionsWithDistance.length);
            } else {
                console.log("[API_MAPBOX] Nenhuma feature encontrada na resposta da API ou array de features vazio.");
                setSuggestions([]);
            }
        } catch (error) {
            console.error('[API_MAPBOX] ERRO ao buscar ou processar sugestões:', error);
            Alert.alert("Erro na Busca", "Ocorreu um erro ao buscar sugestões. Tente novamente.");
            setSuggestions([]);
        } finally { // finally para garantir que o loading seja desativado
            console.log("[API_MAPBOX] Finalizada tentativa de busca de sugestões. isFetchingSuggestions:", false);
            setIsFetchingSuggestions(false);
        }
    }, []); // useCallback para otimizar, dependências serão gerenciadas pelo useEffect abaixo

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            // Só busca se não estiver carregando a localização inicial E o texto for válido
            console.log(`[EFFECT_SEARCH] Verificando condições para busca: isLoadingLocation=${isLoadingLocation}, searchText.length=${searchText.length}`);
            if (!isLoadingLocation && searchText.length > 2) {
                console.log("[EFFECT_SEARCH] Condições atendidas. Chamando fetchMapboxSuggestions.");
                fetchMapboxSuggestions(searchText, currentLocation);
            } else if (searchText.length <= 2) {
                console.log("[EFFECT_SEARCH] Texto muito curto ou ainda carregando localização. Limpando sugestões.");
                setSuggestions([]); // Limpa se o texto for muito curto
            }
        }, 500); // Debounce de 500ms
        console.log(`[EFFECT_SEARCH] Debounce timer configurado para searchText: "${searchText}"`);
        return () => {
            console.log(`[EFFECT_SEARCH] Limpando debounce timer para searchText: "${searchText}"`);
            clearTimeout(debounceTimer);
        }
    }, [searchText, currentLocation, isLoadingLocation, fetchMapboxSuggestions]);


    // 3. Renderizar Itens da Lista
    const renderSuggestionItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.suggestionItem} 
            onPress={() => {
                console.log("[ITEM_PRESS] Sugestão selecionada:", JSON.stringify(item, null, 2));
                // Ação ao selecionar: ex: navigation.navigate('ScheduleRide', { destination: item.details })
                // Ou preencher o campo de busca e limpar sugestões:
                // setSearchText(item.description);
                // setSuggestions([]);
            }}
        >
            <Ionicons name="location-outline" size={20} color="gray" style={styles.suggestionIcon} />
            <View style={styles.suggestionTextContainer}>
                <Text style={styles.suggestionDescription} numberOfLines={2}>{item.description}</Text>
                {typeof item.distance === 'number' && !isNaN(item.distance) && (
                    <Text style={styles.suggestionDistance}>
                        {item.distance < 1 ? `${(item.distance * 1000).toFixed(0)} m` : `${item.distance.toFixed(1)} km`}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    // 4. Renderizar Conteúdo Principal e Placeholders
    const renderContent = () => {
        if (isLoadingLocation) {
            console.log("[RENDER_CONTENT] Renderizando: isLoadingLocation");
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.placeholderText}>Obtendo sua localização...</Text>
                </View>
            );
        }

        if (locationError && !searchText) { // Mostra erro de localização se não estiver buscando
            console.log("[RENDER_CONTENT] Renderizando: locationError (sem busca ativa)");
             return (
                <View style={styles.placeholderContainer}>
                    <Ionicons name="warning-outline" size={40} color="orange" />
                    <Text style={[styles.placeholderText, { color: 'orange'}]}>{locationError}</Text>
                    {/* Botão Tentar Novamente agora chama a requestLocation do escopo do componente */}
                    <TouchableOpacity onPress={requestLocation} style={styles.retryButton}>
                         <Text style={styles.retryButtonText}>Tentar Novamente</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        
        if (searchText.length > 2 && isFetchingSuggestions) {
            console.log("[RENDER_CONTENT] Renderizando: isFetchingSuggestions");
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.placeholderText}>Buscando sugestões...</Text>
                </View>
            );
        }

        if (searchText.length > 2 && suggestions.length === 0 && !isFetchingSuggestions) {
            console.log("[RENDER_CONTENT] Renderizando: Nenhuma sugestão encontrada");
            return (
                <View style={styles.placeholderContainer}>
                    <Ionicons name="search-outline" size={40} color="gray" />
                    <Text style={styles.placeholderText}>Nenhuma sugestão encontrada para "{searchText}".</Text>
                    {locationError && <Text style={[styles.placeholderText, {fontSize: 12, marginTop: 5}]}>({locationError})</Text>}
                </View>
            );
        }
        
        if (suggestions.length > 0) {
            console.log("[RENDER_CONTENT] Renderizando: Lista de sugestões");
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

        // Placeholder inicial ou quando o texto é muito curto
        console.log("[RENDER_CONTENT] Renderizando: Placeholder inicial/texto curto");
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color="#007AFF" />
                </TouchableOpacity>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Para onde vamos?"
                    value={searchText}
                    onChangeText={setSearchText}
                    autoFocus={true}
                    placeholderTextColor="#8e8e93"
                />
                {searchText.length > 0 && (
                     <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
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
        backgroundColor: '#F9F9F9', // Um cinza bem claro para o fundo
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
        paddingHorizontal: Platform.OS === 'ios' ? 16 : 12, // Ajuste de padding
    },
    list: {
        marginTop: 8,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14, // Mais padding vertical
        borderBottomWidth: 1,
        borderBottomColor: '#EDEDED', // Borda mais suave
    },
    suggestionIcon: {
        marginRight: 12, // Mais espaço para o ícone
        color: '#007AFF', // Cor do ícone
    },
    suggestionTextContainer: { 
        flex: 1, 
        flexDirection: 'row',
        justifyContent: 'space-between', 
        alignItems: 'center',
    },
    suggestionDescription: {
        fontSize: 16,
        color: '#333', 
        flexShrink: 1, 
        marginRight: 8, 
    },
    suggestionDistance: {
        fontSize: 14,
        color: '#8E8E93', // Cinza para distância
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    placeholderText: {
        color: '#8E8E93', // Cinza padrão para placeholders
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
