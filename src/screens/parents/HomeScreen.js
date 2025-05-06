import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    FlatList,
    ScrollView,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

// --- Placeholder Data ---
const SAVED_PLACES = [
    { id: 'home', name: 'Home' },
    { id: 'school', name: 'School' },
    { id: 'daycare', name: 'Daycare' },
];

const CHILDREN = [
    { id: '1', name: 'Alice', age: 5, carSeat: 'Booster' },
    { id: '2', name: 'Bob', age: 2, carSeat: 'Infant' },
];

const HomeScreen = () => {
    const [destination, setDestination] = useState('');
    const [selectedChildren, setSelectedChildren] = useState([]);
    const [carSeatConfirmed, setCarSeatConfirmed] = useState(false);
    const navigation = useNavigation();

    const handleDestinationChange = (text) => {
        setDestination(text);
        // TODO: Implement address autocomplete here
    };

    const handleSelectChild = (childId) => {
        setSelectedChildren((prev) =>
            prev.includes(childId)
                ? prev.filter((id) => id !== childId)
                : [...prev, childId]
        );
    };

    const handleConfirmCarSeat = () => {
        setCarSeatConfirmed(true);
    };

    const handleRequestRide = () => {
        if (selectedChildren.length === 0) {
            alert('Please select at least one child.');
            return;
        }
        if (!carSeatConfirmed) {
            alert('Please confirm car seat availability.');
            return;
        }
        // TODO: Implement ride request logic
        console.log(
            'Requesting ride to:',
            destination,
            'for children:',
            selectedChildren
        );
    };

    const handleGoToScheduledRides = () => {
        navigation.navigate('ScheduleRide');
    };

    const getCarSeatRequirements = () => {
        if (selectedChildren.length === 0) {
            return 'No children selected';
        }
        const requirements = selectedChildren.map(
            (childId) =>
                CHILDREN.find((child) => child.id === childId)?.carSeat
        );
        const uniqueRequirements = [...new Set(requirements)];
        return `Car Seat(s): ${uniqueRequirements.join(', ')}`;
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container}>
                {/* 1. "Where to?" Input (Rounded) */}
                <View style={styles.searchContainer}>
                    <FontAwesome
                        name="search"
                        size={20}
                        color="gray"
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Where to?"
                        value={destination}
                        onChangeText={handleDestinationChange}
                    />
                </View>

                {/* 2. Child Selection (Icons with Text) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Who is riding?</Text>
                    <FlatList
                        data={CHILDREN}
                        horizontal
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.childOptionContainer,
                                    selectedChildren.includes(item.id) &&
                                        styles.selectedChildOptionContainer,
                                ]}
                                onPress={() => handleSelectChild(item.id)}
                            >
                                <Image
                                    source={require('./assets/child_icon.png')} // Replace with your icon
                                    style={styles.childIcon}
                                />
                                <Text style={styles.childOptionText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* 3. Car Seat Verification */}
                {selectedChildren.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {getCarSeatRequirements()}
                        </Text>
                        {!carSeatConfirmed ? (
                            <TouchableOpacity
                                style={styles.confirmButton}
                                onPress={handleConfirmCarSeat}
                            >
                                <Text style={styles.confirmButtonText}>
                                    Confirm Car Seat
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text style={styles.confirmationText}>
                                Car Seat Confirmed
                            </Text>
                        )}
                    </View>
                )}

                {/* 4. Request Ride */}
                <TouchableOpacity
                    style={styles.requestButton}
                    onPress={handleRequestRide}
                    disabled={!destination || selectedChildren.length === 0 || !carSeatConfirmed}
                >
                    <Text style={styles.requestButtonText}>Request Ride</Text>
                </TouchableOpacity>

                {/* 5. Scheduled Rides */}
                <TouchableOpacity
                    style={styles.scheduleButton}
                    onPress={handleGoToScheduledRides}
                >
                    <Text style={styles.scheduleButtonText}>
                        Scheduled Rides
                    </Text>
                </TouchableOpacity>

                {/* 6. Saved Places/Recent Destinations (Icons with Text) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Saved Places</Text>
                    <FlatList
                        data={SAVED_PLACES}
                        horizontal
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.savedPlaceContainer}>
                                <FontAwesome
                                    name="map-marker"
                                    size={24}
                                    color="black"
                                    style={styles.savedPlaceIcon}
                                />
                                <Text style={styles.savedPlaceText}>{item.name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>

                {/* 7. Trip Cost Estimation (Placeholder) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Estimated Cost: (Placeholder)
                    </Text>
                    <Text>Cost will be calculated after ride details are confirmed.</Text>
                </View>

                {/* 8. Safety Features Highlight (Placeholder) */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Safety Features (Placeholder)
                    </Text>
                    <Text>
                        KidGo prioritizes your child's safety with background-checked
                        drivers, car seat verification, and ride tracking.
                    </Text>
                </View>

                {/* 9. Bottom Navigation Bar (Placeholder) */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.bottomNavItem}>
                        <Ionicons name="home-outline" size={24} color="black" />
                        <Text>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomNavItem}>
                        <Ionicons name="calendar-outline" size={24} color="black" />
                        <Text>Schedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomNavItem}>
                        <Ionicons name="person-outline" size={24} color="black" />
                        <Text>Profile</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: 20,
    },
    // Search Bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 24,
        paddingHorizontal: 15,
        marginBottom: 16,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 48,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    // Child Selection
    childOptionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eee',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    selectedChildOptionContainer: {
        backgroundColor: 'blue',
    },
    childIcon: {
        width: 24,
        height: 24,
        marginRight: 8,
    },
    childOptionText: {
        color: 'black',
        fontWeight: 'normal',
        fontSize: 16,
    },
    selectedChildOptionText: {
        color: 'white',
        fontWeight: 'bold',
    },
    // Car Seat Verification
    confirmButton: {
        backgroundColor: 'orange',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    confirmationText: {
        color: 'green',
        fontWeight: 'bold',
    },
    // Saved Places
    savedPlaceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    savedPlaceIcon: {
        marginRight: 8,
    },
    savedPlaceText: {
        fontSize: 16,
    },
    // Buttons
    scheduleButton: {
        backgroundColor: '#ddd',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    scheduleButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    requestButton: {
        backgroundColor: 'green',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    requestButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Bottom Navigation
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: 'lightgray',
    },
    bottomNavItem: {
        alignItems: 'center',
    },
});

export default HomeScreen;