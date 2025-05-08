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
import * as Location from 'expo-location'; // Manter para obter localização do usuário
import * as Crypto from 'expo-crypto'; // Importar expo-crypto para UUID
import { GOOGLE_PLACES_API_KEY } from '@env'; // Mudar para a chave do Google

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
    const [googleSessionToken, setGoogleSessionToken] = useState(null); // Renomeado para clareza
    
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

    // Gerar session_token na montagem
    useEffect(() => {
        const newSessionToken = Crypto.randomUUID();
        setGoogleSessionToken(newSessionToken);
        console.log("[EFFECT_SESSION_TOKEN] Google Places session token gerado:", newSessionToken);
    }, []);

    // 2. Buscar Sugestões quando searchText ou currentLocation mudar (com debounce)
    const fetchGooglePlacesSuggestions = useCallback(async (textToSearch, locationToUse, currentGoogleSessionToken) => {
        if (!textToSearch || textToSearch.length < 3 || !currentGoogleSessionToken) {
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
                // Para Text Search, location e radius são parâmetros importantes
                // Usaremos um raio de 8km (8000m) como no exemplo, pode ser ajustado.
                locationParamsForTextSearch = `&location=${locationToUse.latitude},${locationToUse.longitude}&radius=8000`; 
                console.log(`[API_GOOGLE_PLACES_TEXT_SEARCH] Parâmetros de localização (raio 8km): ${locationParamsForTextSearch}`);
            }

            // Mudando para a API Text Search
            // O sessiontoken não é usado com Text Search.
            // O parâmetro 'types=establishment' pode ser removido ou mantido dependendo do foco desejado.
            // Para "qualquer coisa com o nome", vamos remover 'types' por enquanto.
            let url;
            url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(textToSearch)}&key=${GOOGLE_PLACES_API_KEY}&language=pt${locationParamsForTextSearch}`;
            
            console.log("[API_GOOGLE_PLACES] URL da requisição:", url);

            const response = await fetch(url);
            console.log(`[API_GOOGLE_PLACES] Resposta da API - Status: ${response.status}, OK: ${response.ok}`);

            const data = await response.json();
            console.log("[API_GOOGLE_PLACES] Dados brutos da API (Autocomplete):", JSON.stringify(data, null, 2));

            if (data.results && data.status === 'OK') {
                console.log(`[API_GOOGLE_PLACES_TEXT_SEARCH] ${data.results.length} resultados encontrados. Mapeando...`);
                
                // Com Text Search, os resultados já contêm geometria, então não precisamos de chamadas de Details para cada um.
                const processedSuggestions = data.results.map(result => {
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
                            console.log(`[DISTANCE_CALC] Distância para "${result.name}": ${distance?.toFixed(2)} km`);
                        }
                    } else {
                        console.warn(`[API_GOOGLE_PLACES_TEXT_SEARCH] Geometria não encontrada para place_id: ${result.place_id}`);
                    }

                    return {
                        id: result.place_id,
                        name: result.name,
                        address: result.formatted_address || '', // Usar formatted_address
                        description: result.name, // Para exibição principal, podemos usar o nome.
                                                // Ou combinar nome e endereço se preferir uma descrição mais longa.
                        details: result, // Guardar o objeto de resultado completo da Text Search
                        distance: distance,
                        placeTypes: placeTypes, // Adiciona os tipos do local
                    };
                }).sort((a, b) => { // Ordenar estritamente por distância
                    if (a.distance === null && b.distance === null) {
                        return 0; // Mesma ordem se nenhuma distância
                    }
                    if (a.distance === null) {
                        return 1; // a (sem distância) vai para o fim
                    }
                    if (b.distance === null) {
                        return -1; // b (sem distância) vai para o fim, então a vem antes
                    }
                    return a.distance - b.distance; // Ordena pela distância
                });

                setSuggestions(processedSuggestions);
                console.log("[API_GOOGLE_PLACES_TEXT_SEARCH] Sugestões processadas e ordenadas por distância:", processedSuggestions.length);
            } else {
                console.warn(`[API_GOOGLE_PLACES] Nenhuma predição encontrada ou status não OK. Status: ${data.status}, Error: ${data.error_message}`);
                setSuggestions([]);
            }
        } catch (error) {
            console.error('[API_GOOGLE_PLACES] ERRO ao buscar ou processar sugestões:', error);
            Alert.alert("Erro na Busca", "Ocorreu um erro ao buscar sugestões (Google). Verifique sua conexão e tente novamente.");
            setSuggestions([]);
        } finally { // finally para garantir que o loading seja desativado
            setIsFetchingSuggestions(false);
            console.log("[API_GOOGLE_PLACES] Finalizada tentativa de busca de sugestões. isFetchingSuggestions:", false);
        }
    }, []); // googleSessionToken será passado como argumento

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            // Só busca se não estiver carregando a localização inicial E o texto for válido
            console.log(`[EFFECT_SEARCH] Verificando condições para busca: isLoadingLocation=${isLoadingLocation}, searchText.length=${searchText.length}`);
            if (searchText.length <= 2) {
                console.log("[EFFECT_SEARCH] Texto muito curto ou ainda carregando localização. Limpando sugestões.");
                setSuggestions([]); // Limpa se o texto for muito curto
                return;
            }

            if (!isLoadingLocation) {
                // Agora usamos diretamente o searchText, sem adicionar "escola"
                console.log(`[EFFECT_SEARCH] Usando termo de busca original: "${searchText}"`);
                fetchGooglePlacesSuggestions(searchText, currentLocation, googleSessionToken);
            }
        }, 500); // Debounce de 500ms
        console.log(`[EFFECT_SEARCH] Debounce timer configurado para searchText: "${searchText}"`);
        return () => {
            console.log(`[EFFECT_SEARCH] Limpando debounce timer para searchText: "${searchText}"`);
            clearTimeout(debounceTimer);
        } // fetchGooglePlacesSuggestions não precisa ser dependência se não usar nada do escopo do useEffect
    }, [searchText, currentLocation, isLoadingLocation, googleSessionToken, fetchGooglePlacesSuggestions]);


    // 3. Renderizar Itens da Lista
    const renderSuggestionItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.suggestionItem} 
            onPress={() => {
                console.log("[ITEM_PRESS] Sugestão selecionada:", JSON.stringify(item, null, 2));
                // Navegar para ScheduleRide, passando o mapbox_id e outros detalhes.
                // A ScheduleRideScreen precisará usar o item.id (que é o place_id)
                // para fazer uma chamada à Google Places Details API para obter coordenadas.
                navigation.navigate('ScheduleRide', { 
                    selectedPlaceId: item.id, // place_id do Google
                    selectedPlaceDescription: item.description, // Descrição para exibição rápida
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
        
        // Movido para depois do locationError para que o erro de localização tenha prioridade se não houver busca
        if (isLoadingLocation) {
            console.log("[RENDER_CONTENT] Renderizando: isLoadingLocation");
            return (
                <View style={styles.placeholderContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.placeholderText}>Obtendo sua localização...</Text>
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
    leftInfoContainer: { // Novo container para distância e ícone à esquerda
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10, // Espaço entre o grupo da esquerda e a descrição
        // flexShrink: 0, // Para não encolher se a descrição for longa (opcional)
    },
    distanceTextLeft: {
        fontSize: 14,
        color: '#8E8E93',
        // marginRight: 4, // Removido, pois o ícone agora tem margem à direita
    },
    locationIconLeft: {
        // A cor já está definida inline, pode ser movida para cá se preferir
        marginRight: 4, // Adicionado espaço à direita do ícone
    },
    descriptionWrapper: { // Wrapper para a descrição, para permitir que ela ocupe o espaço restante
        flex: 1, // Faz este container ocupar o espaço restante
    },
    descriptionTextMain: {
        fontSize: 16,
        color: '#333', 
        // flexShrink: 1, // Não é mais necessário aqui, pois o wrapper controla o flex
    },
    addressText: { // Novo estilo para o endereço abaixo do nome
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
