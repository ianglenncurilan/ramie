<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Staff Management</h2>
          <p class="sub">Manage staff accounts and roles</p>
        </div>
        <div class="header-actions">
          <img class="panel-illustration" src="/staff.png" alt="icon" />
        </div>
      </div>

      <!-- Stats -->
      <div class="stats">
        <div class="stat-card">
          <span class="stat-value">{{ staff.length }}</span>
          <span class="stat-label">Total Staff</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ adminStaff.length }}</span>
          <span class="stat-label">Admins</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ regularStaff.length }}</span>
          <span class="stat-label">Regular Staff</span>
        </div>
      </div>

      <!-- Add User Button -->
      <div class="add-button-container">
        <button class="add-btn" @click="openAddStaffModal">
          <span>+ Add Staff</span>
        </button>
      </div>

      <!-- Staff Table -->
      <div class="table">
        <div class="tbody">
          <div class="thead">
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Created</span>
            <span>Actions</span>
          </div>
          <div class="row" v-for="staff in staff" :key="staff.id">
            <span class="staff-name">{{ staff.first_name }} {{ staff.last_name }}</span>
            <span class="staff-email">{{ staff.email }}</span>
            <span
              class="staff-role"
              :class="{ administrator: staff.is_admin, regular: !staff.is_admin }"
            >
              {{ staff.is_admin ? 'Administrator' : 'Staff' }}
            </span>
            <span class="created-date">{{ formatDate(staff.created_at) }}</span>
            <div class="actions">
              <button class="edit-btn" @click="editStaff(staff)">✏️</button>
              <button
                class="delete-btn"
                @click="deleteStaff(staff.id)"
                :disabled="staff.id === currentUserId"
              >
                {{ staff.id === currentUserId ? '👤' : 'X' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Add/Edit Staff Modal -->
    <div v-if="showUserModal" class="modal-overlay" @click="closeUserModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingStaff ? 'Edit Staff' : 'Add New Staff' }}</h3>
          <button class="close-btn" @click="closeUserModal">×</button>
        </div>

        <form @submit.prevent="saveUser" class="modal-form">
          <div class="form-group">
            <label>First Name</label>
            <input
              type="text"
              v-model="userForm.first_name"
              required
              class="form-input"
              placeholder="Enter first name"
            />
          </div>

          <div class="form-group">
            <label>Last Name</label>
            <input
              type="text"
              v-model="userForm.last_name"
              required
              class="form-input"
              placeholder="Enter last name"
            />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input
              type="email"
              v-model="userForm.email"
              :readonly="editingStaff"
              required
              class="form-input"
              placeholder="Enter email address"
            />
            <small v-if="editingStaff" class="form-hint">Email cannot be changed</small>
          </div>

          <div class="form-group" v-if="!editingStaff">
            <label>Password</label>
            <input
              type="password"
              v-model="userForm.password"
              required
              class="form-input"
              placeholder="Enter password"
            />
          </div>

          <div class="form-group" v-if="editingStaff">
            <label>Role</label>
            <select v-model="userForm.is_admin" class="form-input">
              <option :value="false">Staff</option>
              <option :value="true">Administrator</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeUserModal">Cancel</button>
            <button type="submit" class="save-btn" :disabled="loading">
              {{ loading ? 'Saving...' : (editingStaff ? 'Update' : 'Create') + ' Staff' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/services/supabase'
import { useAlertModal } from '@/composables/useAlertModal'

const { showAlert, showSuccess, showError } = useAlertModal()

// State
const staff = ref([])
const loading = ref(false)
const showUserModal = ref(false)
const editingStaff = ref(null)
const currentUserId = ref(null)

// Form data
const userForm = ref({
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  is_admin: false,
})

// Computed properties
const adminStaff = computed(() => staff.value.filter((staff) => staff.is_admin))
const regularStaff = computed(() => staff.value.filter((staff) => !staff.is_admin))

// Methods
const fetchStaff = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    staff.value = data || []
  } catch (error) {
    console.error('Error fetching staff:', error)
    showError('Failed to fetch staff')
  } finally {
    loading.value = false
  }
}

const getCurrentUserId = async () => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    currentUserId.value = user?.id
  } catch (error) {
    console.error('Error getting current user:', error)
  }
}

const openAddStaffModal = () => {
  editingStaff.value = null
  resetForm()
  showUserModal.value = true
}

const editStaff = (staffMember) => {
  editingStaff.value = staffMember
  userForm.value = {
    first_name: staffMember.first_name,
    last_name: staffMember.last_name,
    email: staffMember.email,
    password: '', // Don't populate password for editing
    is_admin: staffMember.is_admin,
  }
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  editingStaff.value = null
  resetForm()
}

const resetForm = () => {
  userForm.value = {
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    is_admin: false, // Default to staff role for new users
  }
}

const saveUser = async () => {
  try {
    loading.value = true

    if (editingStaff.value) {
      // Update existing staff
      const { error } = await supabase
        .from('users')
        .update({
          first_name: userForm.value.first_name,
          last_name: userForm.value.last_name,
          is_admin: userForm.value.is_admin,
        })
        .eq('id', editingStaff.value.id)

      if (error) throw error
      showSuccess('Staff updated successfully')
    } else {
      // Create new user in Supabase Auth using signup
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userForm.value.email,
        password: userForm.value.password,
        options: {
          data: {
            first_name: userForm.value.first_name,
            last_name: userForm.value.last_name,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      })

      if (authError) {
        // Handle captcha-related errors specifically
        if (authError.message?.includes('captcha')) {
          throw new Error(
            'Captcha verification is required. Please disable captcha in Supabase project settings or configure it properly.',
          )
        }
        throw authError
      }

      // Wait a moment for the user to be created
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Create user record in users table
      const { data: dbData, error: dbError } = await supabase
        .from('users')
        .upsert({
          id: authData.user?.id,
          email: userForm.value.email,
          first_name: userForm.value.first_name,
          last_name: userForm.value.last_name,
          full_name: `${userForm.value.first_name} ${userForm.value.last_name}`,
          is_admin: userForm.value.is_admin,
          role: userForm.value.is_admin ? 'admin' : 'staff',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          phone: '', // Default empty phone
          profile_picture: null, // Default no profile picture
          status: 'active', // Always active
        })
        .select()
        .single()

      if (dbError) {
        console.error('Error saving user data:', dbError)
        throw new Error('Failed to create user profile. Please contact support.')
      }

      console.log(' User data saved successfully:', dbData)
      console.log(' User ID:', authData.user?.id)
      console.log(' Is Admin:', userForm.value.is_admin)

      // If user is admin, automatically set admin role in auth.users
      if (userForm.value.is_admin && authData.user?.id) {
        console.log('🔧 Setting admin role for user:', authData.user.id)
        console.log('📝 User is_admin value:', userForm.value.is_admin)

        try {
          // Method 1: Try the SQL function
          const { data: result, error: updateError } = await supabase.rpc('set_admin_role', {
            user_uuid: authData.user.id,
          })

          if (!updateError) {
            console.log('✅ Admin role set successfully via RPC')
            console.log('📋 Result:', result)
          } else {
            console.warn('❌ RPC failed:', updateError.message)
            console.log('⚠️  You need to run the SQL function first!')
            console.log('📝 Copy this SQL and run in Supabase SQL Editor:')
            console.log(
              "UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}') || '{\"role\": \"admin\"}' WHERE id = '" +
                authData.user.id +
                "';",
            )

            // Method 2: Show user the exact SQL to run manually
            alert(
              `Admin account created but role needs manual setup. Please run this SQL in Supabase SQL Editor:\n\nUPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}') || '{"role": "admin"}' WHERE id = '${authData.user.id}';`,
            )
          }
        } catch (allError) {
          console.error('❌ Admin role assignment failed:', allError)
          console.log('💡 Manual SQL fix required')
        }
      } else {
        console.log('ℹ️  User is not admin or user ID not available')
        console.log('� is_admin value:', userForm.value.is_admin)
        console.log('📝 user ID:', authData.user?.id)
      }

      showSuccess('Staff created successfully')
    }

    closeUserModal()
    await fetchStaff()
  } catch (error) {
    console.error('Error saving user:', error)
    showError(error.message || 'Failed to save user')
  } finally {
    loading.value = false
  }
}

const deleteStaff = async (staffId) => {
  if (staffId === currentUserId.value) {
    showError('You cannot delete your own account')
    return
  }

  if (
    !confirm('Are you sure you want to delete this staff member? This action cannot be undone.')
  ) {
    return
  }

  try {
    // Delete from users table
    const { error: dbError } = await supabase.from('users').delete().eq('id', staffId)

    if (dbError) throw dbError

    // Note: Auth user will remain but won't have access to app
    // Admin API is required to delete auth users, which needs service role key
    console.warn('Auth user not deleted - requires admin privileges with service role key')

    showSuccess('Staff deleted successfully')
    await fetchStaff()
  } catch (error) {
    console.error('Error deleting staff:', error)
    showError('Failed to delete staff')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([fetchStaff(), getCurrentUserId()])
})
</script>

<style scoped>
.screen {
  padding: 16px;
  background: #f8f9fa;
  min-height: 100vh;
}

.panel {
  background: white;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 1200px;
  margin: 0 auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.back {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #333;
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back:hover {
  background: #f0f0f0;
}

.title-wrap {
  flex: 1;
  text-align: center;
}

.title-lg {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.sub {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
}

.panel-illustration {
  width: 48px;
  height: 48px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 16px;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.add-button-container {
  margin-bottom: 24px;
  text-align: right;
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.table {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.thead {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 120px;
  gap: 16px;
  padding: 16px 20px;
  background: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 1px solid #e9ecef;
}

.row {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 1fr 1fr 1fr 120px;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f3f4;
  align-items: center;
  transition: background 0.2s;
}

.row:hover {
  background: #f8f9fa;
}

.staff-name {
  font-weight: 600;
  color: #2c3e50;
}

.staff-email {
  color: #7f8c8d;
  font-size: 14px;
}

.staff-role {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.staff-role.administrator {
  background: #e3f2fd;
  color: #1976d2;
}

.staff-role.regular {
  background: #f3e5f5;
  color: #7b1fa2;
}

.created-date {
  color: #7f8c8d;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.edit-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.edit-btn:hover {
  background: #bbdefb;
}

.delete-btn {
  background: #ffebee;
  color: #c62828;
}

.delete-btn:hover:not(:disabled) {
  background: #ffcdd2;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding-bottom: 80px; /* Account for bottom bar */
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh; /* Reduced from 90vh to account for bottom bar */
  overflow-y: auto;
  margin: 20px; /* Add margin to ensure visibility */
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 4px;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0f0f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.form-input:read-only {
  background: #f8f9fa;
  color: #7f8c8d;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #7f8c8d;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn,
.save-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f0f0f0;
  color: #7f8c8d;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive Design */
@media (max-width: 768px) {
  .panel {
    padding: 16px;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .thead,
  .row {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .thead span,
  .row span {
    padding: 4px 0;
  }

  .thead span::before,
  .row > span::before {
    content: attr(data-label);
    font-weight: 600;
    color: #2c3e50;
    display: block;
    margin-bottom: 2px;
  }
}
</style>
