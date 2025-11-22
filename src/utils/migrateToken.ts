// Migration utility to rename localStorage keys from adminToken/adminData to token/user
// Run this once in browser console or add to app initialization

export const migrateLocalStorageKeys = () => {
    // Migrate adminToken to token
    const adminToken = localStorage.getItem('adminToken');
    if (adminToken && !localStorage.getItem('token')) {
        localStorage.setItem('token', adminToken);
        console.log('✅ Migrated adminToken to token');
    }

    // Migrate adminData to user
    const adminData = localStorage.getItem('adminData');
    if (adminData && !localStorage.getItem('user')) {
        localStorage.setItem('user', adminData);
        console.log('✅ Migrated adminData to user');
    }

    // Optional: Remove old keys after migration
    // localStorage.removeItem('adminToken');
    // localStorage.removeItem('adminData');
};

// Auto-run migration on import
if (typeof window !== 'undefined') {
    migrateLocalStorageKeys();
}
