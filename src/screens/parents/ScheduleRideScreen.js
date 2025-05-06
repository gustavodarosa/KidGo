import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ScheduleRideScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Schedule Ride Screen (Placeholder)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ScheduleRideScreen;