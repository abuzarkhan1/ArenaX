import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Share,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { teamAPI } from '../../services/teamApi';
import { useAuth } from '../../context/AuthContext';
import Svg, { Path } from 'react-native-svg';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://192.168.99.149:5000';

// Icons
const UsersIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlusIcon = ({ size = 24, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShareIcon = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const CheckCircleIcon = ({ size = 48, color = '#4CAF50' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M22 4L12 14.01l-3-3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AlertCircleIcon = ({ size = 48, color = '#FF3B30' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 8v4M12 16h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const InfoIcon = ({ size = 48, color = '#00BFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 16v-4M12 8h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Custom Alert Component
const CustomAlert = ({ visible, title, message, buttons, type = 'info', onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <AlertCircleIcon />;
      case 'warning':
        return <AlertCircleIcon color="#FF9500" />;
      default:
        return <InfoIcon />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertContent}>
          <View style={styles.alertIconContainer}>
            {getIcon()}
          </View>
          
          <Text style={styles.alertTitle}>{title}</Text>
          {message && <Text style={styles.alertMessage}>{message}</Text>}
          
          <View style={styles.alertButtons}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.alertButton,
                  button.style === 'cancel' && styles.alertButtonCancel,
                  button.style === 'destructive' && styles.alertButtonDestructive,
                  buttons.length === 1 && styles.alertButtonFull,
                ]}
                onPress={() => {
                  if (button.onPress) button.onPress();
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.alertButtonText,
                    button.style === 'cancel' && styles.alertButtonTextCancel,
                    button.style === 'destructive' && styles.alertButtonTextDestructive,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const TeamsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('myTeams');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Create team state
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamType, setTeamType] = useState('duo');
  const [teamLogo, setTeamLogo] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createdTeamCode, setCreatedTeamCode] = useState(null);

  // Join team state
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  // Custom Alert state
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
    type: 'info',
  });

  const showAlert = (title, message, buttons = [{ text: 'OK' }], type = 'info') => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons,
      type,
    });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  const fetchTeams = useCallback(async () => {
    try {
      const response = await teamAPI.getMyTeams();
      if (response.success) {
        setTeams(response.data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeams();
  }, [fetchTeams]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert(
        'Permission Required',
        'Please grant camera roll permissions',
        [{ text: 'OK' }],
        'warning'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setTeamLogo(result.assets[0].uri);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      showAlert('Error', 'Please enter a team name', [{ text: 'OK' }], 'error');
      return;
    }

    setCreating(true);
    try {
      const teamData = {
        name: teamName.trim(),
        teamType,
        logo: teamLogo,
      };

      const response = await teamAPI.createTeam(teamData);
      
      if (response.success) {
        setCreatedTeamCode(response.data.teamCode);
        setTeamName('');
        setTeamLogo(null);
        fetchTeams();
        showAlert(
          'Team Created!',
          `Your team code is: ${response.data.teamCode}\n\nShare this code with your friends to join!`,
          [
            {
              text: 'Share Code',
              onPress: () => shareTeamCode(response.data.teamCode),
            },
            { text: 'OK' },
          ],
          'success'
        );
        setCreateModalVisible(false);
      } else {
        showAlert('Error', response.message || 'Failed to create team', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to create team', [{ text: 'OK' }], 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!joinCode.trim() || joinCode.trim().length !== 6) {
      showAlert('Error', 'Please enter a valid 6-digit team code', [{ text: 'OK' }], 'error');
      return;
    }

    setJoining(true);
    try {
      const response = await teamAPI.joinTeam(joinCode.trim());
      
      if (response.success) {
        showAlert('Success', 'You have joined the team!', [{ text: 'OK' }], 'success');
        setJoinCode('');
        setJoinModalVisible(false);
        fetchTeams();
      } else {
        showAlert('Error', response.message || 'Failed to join team', [{ text: 'OK' }], 'error');
      }
    } catch (error) {
      showAlert('Error', 'Failed to join team', [{ text: 'OK' }], 'error');
    } finally {
      setJoining(false);
    }
  };

  const shareTeamCode = async (code) => {
    try {
      await Share.share({
        message: `Join my team on ArenaX! Use code: ${code}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLeaveTeam = async (teamId, isLeader) => {
    if (isLeader) {
      showAlert(
        'Cannot Leave',
        'You are the team leader. Please delete the team or transfer leadership first.',
        [{ text: 'OK' }],
        'warning'
      );
      return;
    }

    showAlert(
      'Leave Team',
      'Are you sure you want to leave this team?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await teamAPI.leaveTeam(teamId);
              if (response.success) {
                showAlert('Success', 'You have left the team', [{ text: 'OK' }], 'success');
                fetchTeams();
              } else {
                showAlert('Error', response.message || 'Failed to leave team', [{ text: 'OK' }], 'error');
              }
            } catch (error) {
              showAlert('Error', 'Failed to leave team', [{ text: 'OK' }], 'error');
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleDeleteTeam = async (teamId) => {
    showAlert(
      'Delete Team',
      'Are you sure you want to delete this team? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await teamAPI.deleteTeam(teamId);
              if (response.success) {
                showAlert('Success', 'Team deleted successfully', [{ text: 'OK' }], 'success');
                fetchTeams();
              } else {
                showAlert('Error', response.message || 'Failed to delete team', [{ text: 'OK' }], 'error');
              }
            } catch (error) {
              showAlert('Error', 'Failed to delete team', [{ text: 'OK' }], 'error');
            }
          },
        },
      ],
      'warning'
    );
  };

  const renderTeamCard = (team) => {
    const isLeader = team.leader._id === user._id;
    const memberCount = team.members.length;
    const maxMembers = team.teamType === 'duo' ? 2 : 4;

    return (
      <View key={team._id} style={styles.teamCard}>
        <View style={styles.teamHeader}>
          {team.logo ? (
            <Image
              source={{ uri: `${API_URL}${team.logo}` }}
              style={styles.teamLogo}
            />
          ) : (
            <View style={styles.teamLogoPlaceholder}>
              <UsersIcon size={32} color="#00BFFF" />
            </View>
          )}
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            <Text style={styles.teamType}>
              {team.teamType.toUpperCase()} • {memberCount}/{maxMembers} members
            </Text>
          </View>
          {isLeader && <View style={styles.leaderBadge}>
            <Text style={styles.leaderBadgeText}>LEADER</Text>
          </View>}
        </View>

        <View style={styles.teamCodeContainer}>
          <Text style={styles.teamCodeLabel}>Team Code:</Text>
          <Text style={styles.teamCode}>{team.teamCode}</Text>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => shareTeamCode(team.teamCode)}
          >
            <ShareIcon size={18} color="#00BFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.membersContainer}>
          <Text style={styles.membersTitle}>Members:</Text>
          {team.members.map((member) => (
            <View key={member._id} style={styles.memberItem}>
              <Text style={styles.memberName}>
                {member.username}
                {member._id === team.leader._id && ' (Leader)'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.teamActions}>
          {isLeader ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteTeam(team._id)}
            >
              <Text style={styles.actionButtonText}>Delete Team</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.leaveButton]}
              onPress={() => handleLeaveTeam(team._id, isLeader)}
            >
              <Text style={styles.actionButtonText}>Leave Team</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Teams</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={() => setCreateModalVisible(true)}
        >
          <PlusIcon size={20} color="#FFFFFF" />
          <Text style={styles.primaryActionButtonText}>Create Team</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionButton}
          onPress={() => setJoinModalVisible(true)}
        >
          <UsersIcon size={20} color="#00BFFF" />
          <Text style={styles.secondaryActionButtonText}>Join Team</Text>
        </TouchableOpacity>
      </View>

      {/* Teams List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00BFFF"
            colors={['#00BFFF']}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00BFFF" />
          </View>
        ) : teams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <UsersIcon size={64} color="#888888" />
            <Text style={styles.emptyText}>No teams yet</Text>
            <Text style={styles.emptySubtext}>
              Create a team or join one using a team code
            </Text>
          </View>
        ) : (
          teams.map(renderTeamCard)
        )}
      </ScrollView>

      {/* Create Team Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Team</Text>

            <TouchableOpacity style={styles.logoPickerButton} onPress={pickImage}>
              {teamLogo ? (
                <Image source={{ uri: teamLogo }} style={styles.logoPreview} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <PlusIcon size={32} color="#888888" />
                  <Text style={styles.logoPlaceholderText}>Add Logo</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Team Name"
              placeholderTextColor="#888888"
              value={teamName}
              onChangeText={setTeamName}
              maxLength={50}
            />

            <View style={styles.teamTypeContainer}>
              <Text style={styles.teamTypeLabel}>Team Type:</Text>
              <View style={styles.teamTypeButtons}>
                <TouchableOpacity
                  style={[
                    styles.teamTypeButton,
                    teamType === 'duo' && styles.teamTypeButtonActive,
                  ]}
                  onPress={() => setTeamType('duo')}
                >
                  <Text
                    style={[
                      styles.teamTypeButtonText,
                      teamType === 'duo' && styles.teamTypeButtonTextActive,
                    ]}
                  >
                    Duo (2)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.teamTypeButton,
                    teamType === 'squad' && styles.teamTypeButtonActive,
                  ]}
                  onPress={() => setTeamType('squad')}
                >
                  <Text
                    style={[
                      styles.teamTypeButtonText,
                      teamType === 'squad' && styles.teamTypeButtonTextActive,
                    ]}
                  >
                    Squad (4)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setCreateModalVisible(false);
                  setTeamName('');
                  setTeamLogo(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleCreateTeam}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalCreateButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Team Modal */}
      <Modal
        visible={joinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setJoinModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join Team</Text>
            <Text style={styles.modalSubtitle}>
              Enter the 6-digit team code to join
            </Text>

            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="000000"
              placeholderTextColor="#888888"
              value={joinCode}
              onChangeText={setJoinCode}
              keyboardType="number-pad"
              maxLength={6}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setJoinModalVisible(false);
                  setJoinCode('');
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleJoinTeam}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalCreateButtonText}>Join</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        type={alertConfig.type}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BFFF',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E1E1E',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#00BFFF',
  },
  secondaryActionButtonText: {
    color: '#00BFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E0E0',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  teamCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  teamLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  teamType: {
    fontSize: 14,
    color: '#888888',
  },
  leaderBadge: {
    backgroundColor: '#00BFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leaderBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  teamCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  teamCodeLabel: {
    fontSize: 14,
    color: '#888888',
    marginRight: 8,
  },
  teamCode: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#00BFFF',
    letterSpacing: 2,
  },
  shareButton: {
    padding: 8,
  },
  membersContainer: {
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 8,
  },
  memberItem: {
    paddingVertical: 6,
  },
  memberName: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  teamActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  leaveButton: {
    backgroundColor: '#FF9500',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 24,
    textAlign: 'center',
  },
  logoPickerButton: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#888888',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  codeInput: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
  },
  teamTypeContainer: {
    marginBottom: 24,
  },
  teamTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 12,
  },
  teamTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  teamTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  teamTypeButtonActive: {
    backgroundColor: '#00BFFF',
  },
  teamTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  teamTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCreateButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
  },
  modalCreateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  alertIconContainer: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 15,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  alertButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertButtonFull: {
    flex: 1,
  },
  alertButtonCancel: {
    backgroundColor: '#2A2A2A',
  },
  alertButtonDestructive: {
    backgroundColor: '#FF3B30',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertButtonTextCancel: {
    color: '#FFFFFF',
  },
  alertButtonTextDestructive: {
    color: '#FFFFFF',
  },
});

export default TeamsScreen;