import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import WithdrawalModal from "./WithdrawalModal";
import api from "../../services/api";
import DepositModal from "./DepositModal";

const WalletScreen = () => {
  const { user, updateUser } = useAuth();
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Fetch user transactions with pagination
  const fetchTransactions = async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log(`Fetching transactions - Page ${pageNum}...`);
      const response = await api.get(
        `/transactions/my-transactions?page=${pageNum}&limit=5`
      );
      console.log("Transaction response:", response.data);

      if (response.data.success) {
        const newTransactions = response.data.transactions || [];

        if (append) {
          setTransactions((prev) => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }

        // Check if there are more transactions
        if (response.data.pagination) {
          setHasMore(pageNum < response.data.pagination.pages);
        } else {
          setHasMore(newTransactions.length >= 20);
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      console.error("Error details:", error.response?.data);

      if (error.response?.status !== 404 && !append) {
        Alert.alert("Error", "Failed to load transactions. Please try again.", [
          { text: "OK" },
        ]);
      }

      if (!append) {
        setTransactions([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      updateUser();
      setPage(1);
      setHasMore(true);
      fetchTransactions(1, false);
    }, [])
  );

  // Manual refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    await Promise.all([updateUser(), fetchTransactions(1, false)]);
    setRefreshing(false);
  }, []);

  // Load more transactions
  const loadMoreTransactions = () => {
    if (!loadingMore && hasMore && transactions.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTransactions(nextPage, true);
    }
  };

  const handleWithdrawalSubmit = async (withdrawalData) => {
    try {
      console.log("🟡 WalletScreen received:", withdrawalData);
      console.log("🟡 Has password?", !!withdrawalData.password);

      const response = await api.post(
        "/withdrawals",
        {
          amount: withdrawalData.amount,
          paymentMethod: withdrawalData.paymentMethod,
          accountNumber: withdrawalData.accountNumber,
          password: withdrawalData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        await updateUser();
        await fetchTransactions(1, false);
        setPage(1);
        setHasMore(true);
        return response.data;
      } else {
        throw new Error(
          response.data.message || "Failed to submit withdrawal request"
        );
      }
    } catch (error) {
      console.error("Withdrawal submission error:", error);
      console.error("Error details:", error.response?.data);
      throw error;
    }
  };

  const handleDepositPress = () => {
    setShowDepositModal(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get transaction icon and color based on type
  const getTransactionStyle = (type) => {
    const styles = {
      deposit: { icon: "💰", color: "blue" },
      tournament_entry: { icon: "🎮", color: "red" },
      tournament_win: { icon: "🏆", color: "green" },
      bonus: { icon: "🎁", color: "green" },
      purchase: { icon: "💳", color: "red" },
      withdrawal: { icon: "💸", color: "blue" },
      refund: { icon: "↩️", color: "green" },
      admin_adjustment: { icon: "⚙️", color: "green" },
    };
    return styles[type] || { icon: "💵", color: "green" };
  };

  // Get status badge configuration
  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        text: "Pending",
        bgColor: "rgba(251, 191, 36, 0.2)",
        textColor: "#FCD34D",
        icon: "⏳",
      },
      approved: {
        text: "Approved",
        bgColor: "rgba(0, 255, 127, 0.2)",
        textColor: "#00FF7F",
        icon: "✓",
      },
      completed: {
        text: "Completed",
        bgColor: "rgba(0, 255, 127, 0.2)",
        textColor: "#00FF7F",
        icon: "✓",
      },
      rejected: {
        text: "Rejected",
        bgColor: "rgba(239, 68, 68, 0.2)",
        textColor: "#EF4444",
        icon: "✕",
      },
      failed: {
        text: "Failed",
        bgColor: "rgba(239, 68, 68, 0.2)",
        textColor: "#EF4444",
        icon: "✕",
      },
    };
    return badges[status] || badges.completed;
  };

  // Get transaction title based on category
  const getTransactionTitle = (transaction) => {
    return transaction.description || "Transaction";
  };

  const handleDepositSubmit = async (depositData) => {
    try {
      const response = await api.post("/deposits", depositData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        await updateUser();
        await fetchTransactions(1, false);
        setPage(1);
        setHasMore(true);
        return response.data;
      } else {
        throw new Error(
          response.data.message || "Failed to submit deposit request"
        );
      }
    } catch (error) {
      console.error("Deposit submission error:", error);
      throw (
        error.response?.data?.message ||
        error.message ||
        "Failed to submit deposit request"
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom =
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - 100;

          if (isCloseToBottom) {
            loadMoreTransactions();
          }
        }}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00BFFF"
            colors={["#00BFFF"]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Your Balance Label */}
        <Text style={styles.balanceLabel}>Your Balance</Text>

        {/* Balance Display with Icon */}
        <View style={styles.balanceContainer}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.balanceAmount}>
            {user?.coinBalance || 0} Coins
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.arrowUp}>↑</Text>
              <Text style={styles.statLabel}>Total Received</Text>
            </View>
            <Text style={styles.statValue}>{user?.totalCoinsEarned || 0}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.arrowDown}>↓</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <Text style={styles.statValue}>{user?.totalCoinsSpent || 0}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.depositButton}
            onPress={handleDepositPress}
          >
            <Text style={styles.depositButtonText}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => setShowWithdrawalModal(true)}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00BFFF" />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Your transaction history will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => {
                const txStyle = getTransactionStyle(transaction.category);
                const isPositive = transaction.transactionType === "credit";
                const statusBadge = getStatusBadge(transaction.status);
                
                // Show status badge for deposit and withdrawal transactions
                const showStatus = 
                  transaction.category === "deposit" || 
                  transaction.category === "withdrawal";

                return (
                  <View key={transaction._id} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.iconCircle,
                          txStyle.color === "red"
                            ? styles.iconCircleRed
                            : txStyle.color === "blue"
                            ? styles.iconCircleBlue
                            : styles.iconCircleGreen,
                        ]}
                      >
                        <Text style={styles.transactionIcon}>
                          {txStyle.icon}
                        </Text>
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionTitle}>
                          {getTransactionTitle(transaction)}
                        </Text>
                        <View style={styles.transactionMeta}>
                          <Text style={styles.transactionDate}>
                            {formatDate(transaction.createdAt)}
                          </Text>
                          {showStatus && (
                            <>
                              <Text style={styles.metaDot}>•</Text>
                              <View
                                style={[
                                  styles.statusBadge,
                                  { backgroundColor: statusBadge.bgColor },
                                ]}
                              >
                                <Text style={styles.statusBadgeIcon}>
                                  {statusBadge.icon}
                                </Text>
                                <Text
                                  style={[
                                    styles.statusBadgeText,
                                    { color: statusBadge.textColor },
                                  ]}
                                >
                                  {statusBadge.text}
                                </Text>
                              </View>
                            </>
                          )}
                        </View>
                        {/* Show rejection reason if rejected */}
                        {transaction.status === "rejected" &&
                          transaction.rejectionReason && (
                            <Text style={styles.rejectionReason}>
                              Reason: {transaction.rejectionReason}
                            </Text>
                          )}
                      </View>
                    </View>
                    <Text
                      style={[
                        isPositive
                          ? styles.transactionAmountPositive
                          : styles.transactionAmountNegative,
                        // Gray out pending/rejected amounts
                        (transaction.status === "pending" ||
                          transaction.status === "rejected") &&
                          styles.transactionAmountDimmed,
                      ]}
                    >
                      {isPositive ? "+" : "-"}
                      {Math.abs(transaction.amount)} Coins
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Loading More Indicator */}
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#00BFFF" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          )}

          {/* End of List Message */}
          {!loading && !loadingMore && transactions.length > 0 && !hasMore && (
            <View style={styles.endOfListContainer}>
              <Text style={styles.endOfListText}>No more transactions</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <DepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSubmit={handleDepositSubmit}
      />

      {/* Withdrawal Modal */}
      <WithdrawalModal
        visible={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSubmit={handleWithdrawalSubmit}
        currentBalance={user?.coinBalance || 0}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginRight: 48,
  },
  headerSpacer: {
    width: 48,
  },

  // Balance Section
  balanceLabel: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  coinIcon: {
    fontSize: 32,
    marginRight: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 24,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  arrowUp: {
    fontSize: 20,
    color: "#00FF7F",
  },
  arrowDown: {
    fontSize: 20,
    color: "#9CA3AF",
  },
  statLabel: {
    fontSize: 16,
    color: "#E0E0E0",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Button Group
  buttonGroup: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 24,
  },
  depositButton: {
    flex: 1,
    backgroundColor: "#00FF7F",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  depositButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  withdrawButton: {
    flex: 1,
    backgroundColor: "#00BFFF",
    borderRadius: 12,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Transactions Section
  transactionsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },

  // Loading & Empty States
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#E0E0E0",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888888",
    textAlign: "center",
  },

  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 16,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconCircleRed: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
  },
  iconCircleGreen: {
    backgroundColor: "rgba(0, 255, 127, 0.2)",
  },
  iconCircleBlue: {
    backgroundColor: "rgba(0, 191, 255, 0.2)",
  },
  transactionIcon: {
    fontSize: 24,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#E0E0E0",
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  transactionDate: {
    fontSize: 14,
    color: "#888888",
  },
  metaDot: {
    fontSize: 14,
    color: "#888888",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeIcon: {
    fontSize: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  rejectionReason: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
    fontStyle: "italic",
  },
  transactionAmountNegative: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  transactionAmountPositive: {
    fontSize: 16,
    fontWeight: "700",
    color: "#00FF7F",
  },
  transactionAmountDimmed: {
    opacity: 0.5,
  },

  // Loading More & End of List
  loadingMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    fontSize: 14,
    color: "#888888",
    fontWeight: "500",
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  endOfListText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },

  bottomSpacing: {
    height: 20,
  },
});

export default WalletScreen;