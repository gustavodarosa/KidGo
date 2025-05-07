import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    TextInput,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

const COLORS = {
    backgroundLightGray: '#F9F9F9',
    primary: '#000000',
    secondary: '#888888',
    accent: '#FFFFFF',
    lightGray: '#EEEEEE',
    cardShadow: '#000',
};

const SUGGESTED_PLACES = [
    { id: 'school', name: 'Escola', icon: '🏫' },
    { id: 'home', name: 'Casa', icon: '🏠' },
    { id: 'swimming', name: 'Natação', icon: '🧸' },
    { id: 'tutoring', name: 'Reforço', icon: '🎨' },
    { id: 'grandma', name: 'Casa da Vovó', icon: '👵' },
];

const FeatureCard = ({ iconName, iconType = FontAwesome, label, onPress }) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
        {iconType === FontAwesome ? (
            <FontAwesome name={iconName} size={22} color={COLORS.primary} style={styles.featureCardIcon} />
        ) : (
            <Ionicons name={iconName} size={22} color={COLORS.primary} style={styles.featureCardIcon} />
        )}
        <Text style={styles.featureCardLabel}>{label}</Text>
    </TouchableOpacity>
);

const HomeScreen = () => {
    const [searchText, setSearchText] = useState('');
    const navigation = useNavigation();

    const handleNavigateToScheduleRide = () => {
        navigation.navigate('ScheduleRide');
    };

    const handleNavigateToDrivers = () => {
        console.log('Navegar para Ver Motoristas');
        alert('Funcionalidade "Ver Motoristas" em desenvolvimento!');
    };

    const handleNavigateToHistory = () => {
        console.log('Navegar para Histórico');
        alert('Funcionalidade "Histórico" em desenvolvimento!');
    };

    const scrollViewStyle = StyleSheet.compose(styles.container, {
        marginTop: Platform.OS === 'android' ? -StatusBar.currentHeight : -10, // Ajuste o valor -10 para iOS se necessário
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={scrollViewStyle}>
                {/* Barra de Pesquisa */}
                <View style={styles.searchBarContainer}>
                    <FontAwesome name="search" size={20} color={COLORS.secondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pra onde vamos levar hoje?"
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor={COLORS.secondary}
                    />
                    <TouchableOpacity style={styles.nowButton}>
                        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.nowButtonText}>Agora</Text>
                    </TouchableOpacity>
                </View>

                {/* Sugestões */}
                <View style={styles.suggestionsSection}>
                    <Text style={styles.sectionTitle}>Sugestões</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                        {SUGGESTED_PLACES.map(place => (
                            <TouchableOpacity key={place.id} style={styles.suggestionCard}>
                                <Text style={styles.suggestionIcon}>{place.icon}</Text>
                                <Text style={styles.suggestionText}>{place.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Mascote */}
                <Image
                    source={require('./assets/mascot_placeholder.png')}
                    style={styles.mascot}
                    resizeMode="contain"
                />

                {/* Título e Subtítulo */}
                <Text style={styles.title}>Olá, Gustavo!</Text>
                <Text style={styles.subtitle}>O que deseja fazer hoje?</Text>

                {/* Cards de Ações */}
                <View style={styles.cardsContainer}>
                    <FeatureCard
                        iconName="map-marker"
                        iconType={FontAwesome}
                        label="Agendar Corrida"
                        onPress={handleNavigateToScheduleRide}
                    />
                    <FeatureCard
                        iconName="users"
                        iconType={FontAwesome}
                        label="Ver Motoristas"
                        onPress={handleNavigateToDrivers}
                    />
                    <FeatureCard
                        iconName="list-alt"
                        iconType={FontAwesome}
                        label="Histórico"
                        onPress={handleNavigateToHistory}
                    />
                </View>
            </ScrollView>

            {/* Barra de Navegação Inferior */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.bottomNavItem}>
                    <FontAwesome name="home" size={24} color={COLORS.primary} />
                    <Text style={styles.bottomNavItemText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomNavItem}>
                    <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.bottomNavItemText}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomNavItem}>
                    <FontAwesome name="user" size={24} color={COLORS.primary} />
                    <Text style={styles.bottomNavItemText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.backgroundLightGray,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.accent,
        paddingHorizontal: 16,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        borderRadius: 25,
        paddingHorizontal: 15,
        marginTop: 10,
        marginBottom: 20,
        height: 50,
        elevation: 3,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: COLORS.secondary,
    },
    nowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    nowButtonText: {
        marginLeft: 5,
        color: COLORS.primary,
        fontWeight: '600',
    },
    suggestionsSection: {
        marginTop: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    suggestionsScroll: {
        paddingVertical: 10,
    },
    suggestionCard: {
        alignItems: 'center',
        marginRight: 20,
    },
    suggestionIcon: {
        fontSize: 24,
        marginBottom: 5,
    },
    suggestionText: {
        marginTop: 5,
        color: COLORS.primary,
    },
    mascot: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.secondary,
        textAlign: 'center',
        marginBottom: 25,
    },
    cardsContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    featureCard: {
        backgroundColor: COLORS.accent,
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureCardIcon: {
        marginRight: 12,
    },
    featureCardLabel: {
        fontSize: 16,
        color: COLORS.primary,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: COLORS.accent,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },
    bottomNavItem: {
        alignItems: 'center',
    },
    bottomNavItemText: {
        fontSize: 12,
        color: COLORS.primary,
    },
});

export default HomeScreen;