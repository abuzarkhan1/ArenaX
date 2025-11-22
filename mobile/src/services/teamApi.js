import Constants from 'expo-constants';

const API_URL =
    Constants.expoConfig?.extra?.apiUrl ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://192.168.99.149:5000' ||
    'https://overcritically-telaesthetic-hayley.ngrok-free.dev' ||
    'http://10.0.2.2';

import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

export const teamAPI = {
    // Create a new team
    createTeam: async (teamData) => {
        const token = await AsyncStorage.getItem('userToken');
        const formData = new FormData();

        formData.append('name', teamData.name);
        formData.append('teamType', teamData.teamType);

        if (teamData.logo) {
            formData.append('logo', {
                uri: teamData.logo,
                type: 'image/jpeg',
                name: 'team-logo.jpg',
            });
        }

        const response = await fetch(`${API_URL}/api/teams`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        return await response.json();
    },

    // Join a team using code
    joinTeam: async (teamCode) => {
        const headers = await getAuthHeader();
        const response = await fetch(`${API_URL}/api/teams/join`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ teamCode }),
        });

        return await response.json();
    },

    // Get user's teams
    getMyTeams: async () => {
        const headers = await getAuthHeader();
        const response = await fetch(`${API_URL}/api/teams/my-teams`, {
            method: 'GET',
            headers,
        });

        return await response.json();
    },

    // Get team by ID
    getTeamById: async (teamId) => {
        const headers = await getAuthHeader();
        const response = await fetch(`${API_URL}/api/teams/${teamId}`, {
            method: 'GET',
            headers,
        });

        return await response.json();
    },

    // Update team
    updateTeam: async (teamId, teamData) => {
        const token = await AsyncStorage.getItem('userToken');
        const formData = new FormData();

        if (teamData.name) {
            formData.append('name', teamData.name);
        }

        if (teamData.logo) {
            formData.append('logo', {
                uri: teamData.logo,
                type: 'image/jpeg',
                name: 'team-logo.jpg',
            });
        }

        const response = await fetch(`${API_URL}/api/teams/${teamId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: formData,
        });

        return await response.json();
    },

    // Delete team
    deleteTeam: async (teamId) => {
        const headers = await getAuthHeader();
        const response = await fetch(`${API_URL}/api/teams/${teamId}`, {
            method: 'DELETE',
            headers,
        });

        return await response.json();
    },

    // Leave team
    leaveTeam: async (teamId) => {
        const headers = await getAuthHeader();
        const response = await fetch(`${API_URL}/api/teams/${teamId}/leave`, {
            method: 'POST',
            headers,
        });

        return await response.json();
    },
};
