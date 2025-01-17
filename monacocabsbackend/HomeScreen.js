import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import axios from '../services/api';
import * as Location from 'expo-location';

const HomeScreen = ({ navigation, token, setToken }) => {
  const [message, setMessage] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationMessage, setLocationMessage] = useState('');

  const handleGetLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      const reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
      const address = reverseGeocode[0];
      setLocationMessage(`You are at ${address.city}, ${address.region}, ${address.country}.`);
    } catch (error) {
      console.error('Error fetching location:', error.message);
      Alert.alert('Error', 'Failed to fetch location.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bangalore Cabs App</Text>

      <Button title="Get Current Location" onPress={handleGetLocation} />
      {userLocation && (
        <View style={styles.locationContainer}>
          <Text style={styles.details}>
            Latitude: {userLocation.latitude}, Longitude: {userLocation.longitude}
          </Text>
          {locationMessage && <Text style={styles.details}>{locationMessage}</Text>}
        </View>
      )}

      <Button title="View Bookings" onPress={() => navigation.navigate('Bookings')} />
      <Button title="Create Booking" onPress={() => navigation.navigate('CreateBooking')} />
      <Button title="Book via Map" onPress={() => navigation.navigate('MapBookingScreen')} />
      <Button title="Driver Registration" onPress={() => navigation.navigate('DriverRegistration')} />
      <Button title="Logout" onPress={handleLogout} color="red" />

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  locationContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  details: {
    fontSize: 16,
    color: '#555',
    marginVertical: 5,
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    color: 'green',
  },
});

export default HomeScreen;