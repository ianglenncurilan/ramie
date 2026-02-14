<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">User Management</h2>
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
* {
  font-family: 'Quicksand', sans-serif;
  box-sizing: border-box;
}

.screen {
  padding: 16px;
  background: #2f8b60;
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
  font-weight: 700;
  font-size: 24px;
  line-height: 1.05;
  margin: 0;
  padding-top: 6px;
  color: #333;
}

.sub {
  color: #7a8b99;
  font-size: 14px;
  margin-top: 6px;
}

.panel-illustration {
  width: 48px;
  height: 48px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 16px 0;
}

.stat-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stat-value {
  display: block;
  font-size: 30px;
  font-weight: 700;
  color: #2f8b60;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #6c757d;
  margin-top: 4px;
}

.add-button-container {
  display: flex;
  justify-content: flex-end;
  margin: 16px 0;
}

.add-btn {
  padding: 8px 16px;
  border-radius: 12px;
  background: #2f8b60;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  width: auto;
  min-width: 150px;
  cursor: pointer;
  padding-left: 20px;
}

.table {
  background: #f8f9fa;
  margin-top: 12px;
  border: 1px solid #e9ecef;
  border-radius: 14px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  max-height: 60vh;
  overflow: hidden;
}

.thead,
.row {
  display: grid;
  grid-template-columns: 1.5fr 1.5fr 1fr 1fr 120px;
  gap: 12px;
  padding: 10px 12px;
  align-items: center;
  min-width: 780px;
}

.thead {
  font-weight: 600;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  background: #e9ecef;
  z-index: 1;
}

.tbody {
  overflow: auto;
  flex: 1;
  min-height: 0;
}

.row {
  border-bottom: 1px solid #dee2e6;
  background: #ffffff;
}

.row:last-child {
  border-bottom: 0;
}

.row:hover {
  background: #f1f3f4;
}

.staff-name {
  font-weight: 600;
  color: #333;
}

.staff-email {
  color: #666;
  font-size: 14px;
}

.staff-role {
  padding: 6px 8px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  text-align: start;
  background: #f3f2f8;
}

.staff-role.administrator {
  color: #000000ff;
}

.staff-role.regular {
  color: #000000ff;
}

.created-date {
  color: #666;
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
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.edit-btn {
  background: #e3f2fd;
  color: #1976d2;
}

.delete-btn {
  background: #ffebee;
  color: #d32f2f;
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
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
}

/* Form */
.modal-form {
  padding: 0 20px 20px 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #2f8b60;
  box-shadow: 0 0 0 2px rgba(47, 139, 96, 0.1);
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

/* Form actions */
.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.save-btn {
  background: #2f8b60;
  color: white;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .panel {
    margin: 8px 8px 100px 8px;
    padding: 16px;
  }

  .panel-header {
    grid-template-columns: auto 1fr;
    gap: 12px;
  }

  .panel-illustration {
    display: none;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-card {
    padding: 12px;
    border-radius: 10px;
  }

  .table {
    padding: 4px;
    border-radius: 10px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 100px;
    gap: 6px;
    padding: 6px 4px;
    font-size: 11px;
    min-width: 600px;
  }

  .actions {
    gap: 3px;
  }

  .edit-btn,
  .delete-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .modal {
    margin: 8px;
    max-height: 96vh;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .panel {
    margin: 10px 10px 100px 10px;
    padding: 17px;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 14px;
  }

  .panel-illustration {
    width: 48px;
    height: 48px;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 9px;
  }

  .stat-card {
    padding: 13px;
    border-radius: 11px;
  }

  .table {
    padding: 5px;
    border-radius: 11px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 105px;
    gap: 7px;
    padding: 7px 5px;
    font-size: 11px;
    min-width: 630px;
  }

  .actions {
    gap: 3px;
  }

  .edit-btn,
  .delete-btn {
    width: 26px;
    height: 26px;
    font-size: 13px;
  }

  .modal {
    margin: 9px;
    max-height: 95vh;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .panel {
    margin: 12px 12px 100px 12px;
    padding: 18px;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 16px;
  }

  .panel-illustration {
    width: 56px;
    height: 56px;
  }

  .stats {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .stat-card {
    padding: 14px;
    border-radius: 12px;
  }

  .table {
    padding: 6px;
    border-radius: 12px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 110px;
    gap: 8px;
    padding: 8px 6px;
    font-size: 12px;
    min-width: 660px;
  }

  .actions {
    gap: 4px;
  }

  .edit-btn,
  .delete-btn {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .modal {
    margin: 10px;
    max-height: 95vh;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .panel {
    margin: 14px 14px 100px 14px;
    padding: 20px;
    max-width: 768px;
    margin-left: auto;
    margin-right: auto;
  }

  .panel-header {
    grid-template-columns: auto 1fr auto;
    gap: 20px;
  }

  .panel-illustration {
    width: 60px;
    height: 60px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-card {
    padding: 16px;
    border-radius: 14px;
  }

  .table {
    padding: 8px;
    border-radius: 14px;
  }

  .thead,
  .row {
    grid-template-columns: 1.4fr 0.9fr 0.9fr 1fr 120px;
    gap: 10px;
    padding: 10px 8px;
    font-size: 13px;
    min-width: 720px;
  }

  .actions {
    gap: 5px;
  }

  .edit-btn,
  .delete-btn {
    width: 30px;
    height: 30px;
    font-size: 15px;
  }

  .modal {
    margin: 15px;
    max-height: 90vh;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .panel {
    margin: 16px 16px 100px 16px;
    padding: 22px;
    max-width: 1024px;
    margin-left: auto;
    margin-right: auto;
  }

  .panel-header {
    gap: 24px;
  }

  .panel-illustration {
    width: 64px;
    height: 64px;
  }

  .stats {
    gap: 14px;
  }

  .stat-card {
    padding: 18px;
    border-radius: 16px;
  }

  .table {
    padding: 10px;
    border-radius: 16px;
  }

  .thead,
  .row {
    gap: 12px;
    padding: 12px 10px;
    font-size: 14px;
    min-width: 780px;
  }

  .edit-btn,
  .delete-btn {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .modal {
    margin: 20px;
    max-width: 500px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .panel {
    margin: 20px 20px 100px 20px;
    padding: 24px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  .panel-header {
    gap: 28px;
  }

  .panel-illustration {
    width: 72px;
    height: 72px;
  }

  .stats {
    gap: 16px;
  }

  .stat-card {
    padding: 20px;
    border-radius: 18px;
  }

  .table {
    padding: 12px;
    border-radius: 18px;
  }

  .thead,
  .row {
    gap: 14px;
    padding: 14px 12px;
    font-size: 15px;
    min-width: 840px;
  }

  .modal {
    margin: 24px;
    max-width: 500px;
  }
}
</style>
