<template>
  <div class="screen">
    <section class="hero">
      <img src="/pig.jpg" alt="hero" />
      <div class="overlay">
        <div class="brand">
          <div class="title"></div>
        </div>
      </div>
    </section>
    <div class="panel">
      <div class="avatar">
        <img
          v-if="userProfile.profilePicture"
          :src="userProfile.profilePicture"
          alt="Profile Picture"
        />
        <span v-else class="initials">{{ userInitials }}</span>
      </div>
      <div class="name">{{ userProfile.name || 'Loading...' }}</div>
      <div class="email">{{ userProfile.email }}</div>
      <div class="status-message">Your account is active and secure. We're always here to help you manage your farm efficiently.</div>
      

      <div class="menu">
        <button v-if="isAdminUser" class="row" @click="$router.push({ name: 'admin' })">
          <span>Admin</span>
          <span>›</span>
        </button>
        <button class="signout" title="Securely end your session." @click="showSignOutConfirm = true">Sign out</button>
      </div>
    </div>

    <!-- Edit Profile Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Edit Profile</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>

        <div class="modal-content">
          <form @submit.prevent="saveProfile" class="edit-form">
            <!-- Profile Picture Section -->
            <div class="form-group profile-picture-group">
              <label>Profile Picture</label>
              <div class="profile-picture-container">
                <div class="profile-picture-preview">
                  <img
                    v-if="profilePicturePreview"
                    :src="profilePicturePreview"
                    alt="Profile Preview"
                  />
                  <div v-else class="no-image">
                    <i class="mdi mdi-camera"></i>
                    <span>No image</span>
                  </div>
                </div>
                <div class="profile-picture-actions">
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleProfilePictureChange"
                    id="profile-picture-input"
                    style="display: none"
                  />
                  <label for="profile-picture-input" class="upload-btn">
                    <i class="mdi mdi-upload"></i>
                    Choose Image
                  </label>
                  <button
                    v-if="profilePicturePreview"
                    type="button"
                    class="remove-btn"
                    @click="removeProfilePicture"
                  >
                    <i class="mdi mdi-delete"></i>
                    Remove
                  </button>
                </div>
              </div>
              <span v-if="editErrors.profilePicture" class="error-text">{{
                editErrors.profilePicture
              }}</span>
            </div>

            <div class="form-group">
              <label>Full Name</label>
              <input
                v-model="editForm.name"
                type="text"
                placeholder="Enter your full name"
                :class="{ error: editErrors.name }"
              />
              <span v-if="editErrors.name" class="error-text">{{ editErrors.name }}</span>
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input
                v-model="editForm.email"
                type="email"
                placeholder="Enter your email address"
                :class="{ error: editErrors.email }"
              />
              <span v-if="editErrors.email" class="error-text">{{ editErrors.email }}</span>
            </div>

            <div class="form-group">
              <label>Phone Number</label>
              <input v-model="editForm.phone" type="tel" placeholder="Enter your phone number" />
            </div>

            <div v-if="editErrors.general" class="error-message general-error">
              {{ editErrors.general }}
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeEditModal">Cancel</button>
              <button type="submit" class="save-btn">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Sign Out Confirmation Modal -->
    <div v-if="showSignOutConfirm" class="confirm-overlay" @click="cancelSignOut">
      <div class="confirm-modal" @click.stop>
        <h3 class="confirm-title">Sign out of {{ userProfile.name || 'your account' }}?</h3>
        <p>This will securely end your session.</p>
        <div class="confirm-actions">
          <button class="btn btn-cancel" @click="cancelSignOut">Cancel</button>
          <button class="btn btn-danger" @click="confirmSignOut">Sign Out</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase, hasSupabaseConfig } from '../services/supabase'

const router = useRouter()
// Profile state
const userProfile = ref({
  name: '',
  email: '',
  phone: '',
  profilePicture: null,
  id: null,
})

// Modal state
const showEditModal = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Admin flag
const isAdminUser = ref(false)
const showSignOutConfirm = ref(false)

// Edit profile form state
const editForm = ref({
  name: '',
  email: '',
  phone: '',
  profilePicture: null,
})
const editErrors = ref({})
const profilePicturePreview = ref(null)
const userInitials = computed(() => {
  const name = (userProfile.value.name || '').trim()
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || ''
    const second = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + second).toUpperCase() || first.toUpperCase()
  }
  // fallback to email local part
  const email = userProfile.value.email || ''
  const local = email.split('@')[0] || ''
  if (local) {
    const segs = local.split(/[.-_]/).filter(Boolean)
    const first = segs[0]?.[0] || ''
    const second = segs.length > 1 ? segs[1][0] : ''
    return (first + second).toUpperCase() || first.toUpperCase() || 'U'
  }
  return 'U'
})

// Fetch user data from Supabase
async function fetchUserProfile() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('Error fetching user:', error.message)
      return
    }

    if (user) {
      // Get user metadata from both possible locations
      const metadata = user.user_metadata || {}
      const appMetadata = user.app_metadata || {}
      
      userProfile.value = {
        id: user.id,
        name: metadata.name || metadata.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        phone: metadata.phone || '',
        profilePicture: metadata.avatar_url || metadata.picture || null,
        createdAt: user.created_at
      }
      
      // Update the edit form with current values
      editForm.value.name = userProfile.value.name
      editForm.value.email = userProfile.value.email
      editForm.value.phone = userProfile.value.phone
      editForm.value.profilePicture = userProfile.value.profilePicture
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

// Load user data on component mount
onMounted(() => {
  fetchUserProfile()
})

// Removed PIN functions

// Edit profile functions
function openEditModal() {
  showEditModal.value = true
  editForm.value = {
    name: userProfile.value.name,
    email: userProfile.value.email,
    phone: userProfile.value.phone,
    profilePicture: userProfile.value.profilePicture,
  }
  profilePicturePreview.value = userProfile.value.profilePicture
  editErrors.value = {}
}

function closeEditModal() {
  showEditModal.value = false
  editForm.value = {
    name: '',
    email: '',
    phone: '',
    profilePicture: null,
  }
  profilePicturePreview.value = null
  editErrors.value = {}
}

function validateEditForm() {
  const errors = {}

  if (!editForm.value.name.trim()) {
    errors.name = 'Name is required'
  }

  if (!editForm.value.email.trim()) {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.value.email)) {
    errors.email = 'Please enter a valid email address'
  }

  editErrors.value = errors
  return Object.keys(errors).length === 0
}

async function saveProfile() {
  if (validateEditForm()) {
    try {
      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: editForm.value.name.trim(),
          phone: editForm.value.phone.trim(),
          profile_picture: editForm.value.profilePicture,
        },
      })

      if (error) {
        console.error('Error updating profile:', error.message)
        editErrors.value.general = 'Failed to update profile. Please try again.'
        return
      }

      // Update local profile data
      userProfile.value = {
        ...userProfile.value,
        name: editForm.value.name.trim(),
        phone: editForm.value.phone.trim(),
        profilePicture: editForm.value.profilePicture,
      }

      closeEditModal()
    } catch (error) {
      console.error('Error updating profile:', error)
      editErrors.value.general = 'An unexpected error occurred. Please try again.'
    }
  }
}

// Profile picture functions
function handleProfilePictureChange(event) {
  const file = event.target.files[0]
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      editErrors.value.profilePicture = 'Please select a valid image file'
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      editErrors.value.profilePicture = 'Image size must be less than 5MB'
      return
    }

    // Clear any previous errors
    editErrors.value.profilePicture = ''

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePicturePreview.value = e.target.result
      editForm.value.profilePicture = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

function removeProfilePicture() {
  editForm.value.profilePicture = null
  profilePicturePreview.value = null
  editErrors.value.profilePicture = ''
}

// Sign out function
async function handleSignOut() {
  try {
    if (hasSupabaseConfig) {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear local storage and redirect
      localStorage.clear()
      sessionStorage.clear()
      await router.replace('/login')
      window.location.reload() // Ensure a clean state
    } else {
      console.warn('Supabase config missing; performing local sign out only')
      localStorage.clear()
      sessionStorage.clear()
      await router.replace('/login')
      window.location.reload()
    }
  } catch (error) {
    console.error('Error signing out:', error)
    // Still redirect to login even if there was an error
    await router.replace('/login')
    window.location.reload()
  }
}

const accountAgeText = computed(() => {
  const started = userProfile.value?.createdAt
  if (!started) return 'Welcome to RAMIE'
  const start = new Date(started)
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months = Math.max(0, months - 1)
  const years = Math.floor(months / 12)
  const rem = months % 12
  const y = years > 0 ? `${years} year${years > 1 ? 's' : ''}` : ''
  const m = rem > 0 ? `${rem} month${rem > 1 ? 's' : ''}` : ''
  const parts = [y, m].filter(Boolean)
  return parts.length ? `You've been using RAMIE for ${parts.join(' and ')}!` : 'New to RAMIE — let’s get started!'
})

async function confirmSignOut() {
  showSignOutConfirm.value = false
  await handleSignOut()
}

function cancelSignOut() {
  showSignOutConfirm.value = false
}
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  height: 100vh;
  background: #f5f5f5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.hero {
  margin: 16px;
  position: relative;
}
.hero img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 14px;
}
.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  padding: 12px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.35));
  border-radius: 14px;
}
.brand { display: inline-flex; align-items: center; gap: 8px; }
.brand-logo { width: 32px; height: 32px; object-fit: contain; }
.overlay .title { font-weight: 700; font-size: 22px; }
.panel {
  margin: 0 16px 16px 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  padding-bottom: 16px;
}
.avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: #fff;
  color: #2f8b60;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  margin-top: 20px;
  border: 6px solid #2f8b60;
  overflow: hidden;
}
.avatar-hint {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.9;
}
.link-btn {
  background: transparent;
  border: none;
  color: #fff;
  text-decoration: underline;
  cursor: pointer;
  font-size: 12px;
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatar .initials { font-size: 28px; font-weight: 700; }
.name {
  font-weight: 700;
  margin-top: 10px;
  margin-bottom: 6px;
}

.email {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 14px;
}
.status-message {
  font-size: 12px;
  opacity: 0.95;
  margin-bottom: 6px;
}
.usage-message {
  font-size: 12px;
  opacity: 0.95;
  margin-bottom: 12px;
}
.menu {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  justify-items: center; /* allow children to center */
}
.row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  color: #333;
  border-radius: 12px;
  padding: 12px 14px;
  margin: 8px 0;
}
.signout {
  width: 70%; /* smaller than full width */
  max-width: 360px;
  justify-self: center; /* center within grid */
  background: #428542;
  color: #fff;
  border-radius: 9999px; /* pill like login */
  height: 48px; /* match login button height */
  padding: 0 16px;
  margin-top: 10px;
  font-size: 14px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.signout:hover {
  background: #003a05;
}
button {
  cursor: pointer;
}
.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.bottombar button {
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.2s ease-in-out;
}

.bottombar button:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

.bottombar button.active {
  background: #2f8b60;
  color: #fff;
}

.bottombar button.active img {
  filter: brightness(0) invert(1);
}

.bottombar img {
  width: 32px;
  height: 32px;
  object-fit: contain;
  transition: filter 0.2s ease-in-out;
}

/* Removed PIN styles */
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
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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

.modal-content {
  padding: 0 20px 20px 20px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.pin-input-container {
  text-align: center;
}

.pin-display {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 30px;
}

.pin-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: transparent;
  transition: all 0.2s ease;
}

.pin-dot.filled {
  background: #2f8b60;
  border-color: #2f8b60;
}

.pin-keypad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 240px;
  margin: 0 auto;
}

.pin-key {
  width: 60px;
  height: 60px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 12px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pin-key:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}

.pin-key:active {
  transform: scale(0.95);
}

.error-message {
  color: #d32f2f;
  font-size: 14px;
  margin-top: 16px;
  font-weight: 500;
}

.success-message {
  color: #2f8b60;
  font-size: 14px;
  margin-top: 16px;
  font-weight: 500;
}

/* Edit Profile Modal Styles */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-group input {
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  outline: none;
}

.form-group input:focus {
  border-color: #2f8b60;
}

.form-group input.error {
  border-color: #e74c3c;
}

.error-text {
  color: #e74c3c;
  font-size: 12px;
  font-weight: 500;
}

.general-error {
  background: #fdf2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding: 16px 0;
  background: white;
  border-top: 1px solid #f0f0f0;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.cancel-btn {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  background: #fff;
  color: #666;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #f8f9fa;
  border-color: #d1d5db;
}

.save-btn {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: #2f8b60;
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  background: #256c3c;
  transform: translateY(-1px);
}

/* Profile Picture Styles */
.profile-picture-group {
  text-align: center;
}

.profile-picture-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.profile-picture-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 3px solid #e1e5e9;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.profile-picture-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #666;
}

.no-image i {
  font-size: 32px;
  color: #ccc;
}

.no-image span {
  font-size: 12px;
  font-weight: 500;
}

.profile-picture-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #2f8b60;
  color: white;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.upload-btn:hover {
  background: #256c3c;
  transform: translateY(-1px);
}

.upload-btn i {
  font-size: 16px;
}

.remove-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: #c0392b;
  transform: translateY(-1px);
}

.remove-btn i {
  font-size: 16px;
}

/* Mobile modal improvements */
@media (max-width: 480px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal {
    max-height: 90vh;
    border-radius: 12px;
  }

  .modal-header {
    padding: 16px 16px 0 16px;
  }

  .modal-content {
    padding: 0 16px 16px 16px;
  }

  .form-actions {
    padding: 12px 0;
    margin-top: 16px;
  }

  .cancel-btn,
  .save-btn {
    padding: 10px 12px;
    font-size: 14px;
  }
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}

.confirm-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 380px;
  padding: 16px;
}

.confirm-title { font-weight: 700; margin: 0 0 8px 0; }

.confirm-actions { display: flex; gap: 8px; margin-top: 12px; }

.confirm-actions .btn { flex: 1; padding: 10px 12px; border-radius: 8px; border: none; cursor: pointer; }

.btn-cancel { background: #f5f5f5; color: #333; }

.btn-danger { background: #e53935; color: #fff; }
</style>
