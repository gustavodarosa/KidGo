import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RideDetailsScreen = ({ route }) => {
    const { ride } = route.params;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ride Details</Text>
            <Text style={styles.label}>Driver:</Text>
            <Text style={styles.value}>{ride.driverName}</Text>
            <Text style={styles.label}>Child:</Text>
            <Text style={styles.value}>{ride.childName}</Text>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{ride.status}</Text>
            <Text style={styles.label}>Pickup Location:</Text>
            <Text style={styles.value}>{ride.pickupLocation}</Text>
            <Text style={styles.label}>Drop-off Location:</Text>
            <Text style={styles.value}>{ride.dropoffLocation}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        marginBottom: 10,
    },
});

export default RideDetailsScreen;