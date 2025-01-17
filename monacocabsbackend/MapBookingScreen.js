import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';

const MapBookingScreen = ({ token, navigation }) => {
  const [region, setRegion] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [pickupName, setPickupName] = useState('');
  const [dropoffName, setDropoffName] = useState('');
  const [fare, setFare] = useState(0);
  const [route, setRoute] = useState([]); // Route coordinates for Polyline

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Using default location (Bangalore).');
          setRegion({
            latitude: 12.9716,
            longitude: 77.5946,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } catch (error) {
        console.error('Error fetching user location:', error.message);
        Alert.alert('Error', 'Using default location (Bangalore).');
        setRegion({
          latitude: 12.9716,
          longitude: 77.5946,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      }
    };

    fetchUserLocation();
  }, []);

  const calculateFare = async () => {
    if (!pickupCoords || !dropoffCoords) {
      Alert.alert('Error', 'Please select both pickup and drop-off locations.');
      return;
    }

    try {
      // Calculate distance using Haversine formula
      const toRadians = (deg) => (deg * Math.PI) / 180;
      const R = 6371; // Radius of Earth in km
      const dLat = toRadians(dropoffCoords.latitude - pickupCoords.latitude);
      const dLng = toRadians(dropoffCoords.longitude - pickupCoords.longitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(pickupCoords.latitude)) *
          Math.cos(toRadians(dropoffCoords.latitude)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // Distance in km

      console.log('Distance:', distance); // Debug log

      // Calculate fare
      const calculatedFare = distance < 5 ? 20.5 : distance * 5; // Example logic
      console.log('Calculated Fare:', calculatedFare); // Debug log
      setFare(calculatedFare);

      // Fetch and display route
      setRoute([pickupCoords, dropoffCoords]); // Simulate Polyline for now
    } catch (error) {
      console.error('Error calculating fare:', error.message);
      Alert.alert('Error', 'Failed to calculate fare.');
    }
  };

  const reverseGeocodeLocation = async () => {
    try {
      if (pickupCoords) {
        const pickupAddress = await Location.reverseGeocodeAsync(pickupCoords);
        console.log('Pickup Address:', pickupAddress); // Debug log
        if (pickupAddress.length > 0) {
          setPickupName(`${pickupAddress[0].name}, ${pickupAddress[0].city}`);
        }
      }

      if (dropoffCoords) {
        const dropoffAddress = await Location.reverseGeocodeAsync(dropoffCoords);
        console.log('Dropoff Address:', dropoffAddress); // Debug log
        if (dropoffAddress.length > 0) {
          setDropoffName(`${dropoffAddress[0].name}, ${dropoffAddress[0].city}`);
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error.message);
      Alert.alert('Error', 'Failed to fetch place names.');
    }
  };

  const handleConfirmBooking = async () => {
    if (!pickupCoords || !dropoffCoords) {
      Alert.alert('Error', 'Please select both pickup and drop-off locations.');
      return;
    }

    try {
      const bookingResponse = await axios.post(
        'http://192.168.224.14:5000/book',
        {
          pickupLocation: pickupName || 'Custom Pickup',
          dropoffLocation: dropoffName || 'Custom Dropoff',
          fare,
          userCoords: pickupCoords,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Booking created successfully!');
      navigation.navigate('Bookings');
    } catch (error) {
      console.error('Error creating booking:', error.message);
      Alert.alert('Error', 'Failed to create booking.');
    }
  };

  useEffect(() => {
    reverseGeocodeLocation();
    if (pickupCoords && dropoffCoords) calculateFare();
  }, [pickupCoords, dropoffCoords]);

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} onRegionChangeComplete={setRegion}>
        {pickupCoords && (
          <Marker
            coordinate={pickupCoords}
            pinColor="green"
            draggable
            onDragEnd={(e) => setPickupCoords(e.nativeEvent.coordinate)}
          />
        )}
        {dropoffCoords && (
          <Marker
            coordinate={dropoffCoords}
            pinColor="red"
            draggable
            onDragEnd={(e) => setDropoffCoords(e.nativeEvent.coordinate)}
          />
        )}
        {route.length > 0 && <Polyline coordinates={route} strokeWidth={3} strokeColor="blue" />}
      </MapView>
      <View style={styles.buttonContainer}>
        <Text>Pickup: {pickupName || 'Not selected'}</Text>
        <Text>Drop-off: {dropoffName || 'Not selected'}</Text>
        <Text>Fare: ₹{fare.toFixed(2)}</Text>
        <Button title="Set Pickup Location" onPress={() => setPickupCoords(region)} />
        <Button title="Set Drop-off Location" onPress={() => setDropoffCoords(region)} />
        <Button title="Confirm Booking" onPress={handleConfirmBooking} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MapBookingScreen;
