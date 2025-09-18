import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function FormationsScreen() {
  const formations = [
    {
      id: 1,
      title: 'Safety Training / Formation Sécurité',
      description: 'Basic safety procedures / Procédures de sécurité de base',
      duration: '2 hours / 2 heures',
      status: 'Available / Disponible'
    },
    {
      id: 2,
      title: 'Emergency Response / Réponse d\'urgence',
      description: 'Emergency protocols / Protocoles d\'urgence',
      duration: '3 hours / 3 heures',
      status: 'Available / Disponible'
    },
    {
      id: 3,
      title: 'Equipment Handling / Manipulation d\'équipement',
      description: 'Proper equipment usage / Utilisation appropriée de l\'équipement',
      duration: '1.5 hours / 1,5 heures',
      status: 'Coming Soon / Bientôt disponible'
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Formations / Training</Text>
        <Text style={styles.subtitle}>Available training modules / Modules de formation disponibles</Text>
      </View>
      
      <View style={styles.content}>
        {formations.map((formation) => (
          <TouchableOpacity key={formation.id} style={styles.formationCard}>
            <Text style={styles.formationTitle}>{formation.title}</Text>
            <Text style={styles.formationDescription}>{formation.description}</Text>
            <View style={styles.formationDetails}>
              <Text style={styles.duration}>{formation.duration}</Text>
              <Text style={[styles.status, formation.status.includes('Coming') ? styles.comingSoon : styles.available]}>
                {formation.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#28a745',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  formationCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  formationDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  available: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  comingSoon: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
});