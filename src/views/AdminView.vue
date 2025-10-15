<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Admin</h2>
          <p class="sub">Administrator controls and settings</p>
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="label">Role</div>
          <div class="value">Admin</div>
        </div>

        <div class="card">
          <div class="label">Access</div>
          <div class="value">Full</div>
        </div>
      </div>

      <div class="section">
        <h3>Quick Actions</h3>
        <div class="actions">
          <button class="btn" @click="toggleLocalAdmin(false)">Simulate Regular</button>
          <button class="btn primary" @click="toggleLocalAdmin(true)">Simulate Admin</button>
        </div>
        <p class="muted">
          Use these to locally override admin role for testing. This does not change the user in
          Supabase. Remove the override to rely on `app_metadata.is_admin`.
        </p>
        <div class="actions">
          <button class="btn" @click="clearOverride()">Clear Override</button>
        </div>
      </div>
    </section>

    <nav class="bottombar">
      <button
        @click="$router.push({ name: 'dashboard' })"
        :class="{ active: $route.name === 'dashboard' }"
      >
        <img src="/home.png" alt="Dashboard" />
      </button>
      <button
        @click="$router.push({ name: 'records' })"
        :class="{ active: $route.name === 'records' }"
      >
        <img src="/record.png" alt="Records" />
      </button>
      <button
        @click="$router.push({ name: 'expenses' })"
        :class="{ active: $route.name === 'expenses' }"
      >
        <img src="/expensesicon.png" alt="Expenses" />
      </button>
      <button
        @click="$router.push({ name: 'manage-staff' })"
        :class="{ active: $route.name === 'manage-staff' }"
      >
        <img src="/staff.png" alt="Manage Staff" />
      </button>
      <button
        @click="$router.push({ name: 'profile' })"
        :class="{ active: $route.name === 'profile' }"
      >
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import { setLocalAdminOverride } from '../services/supabase'

function toggleLocalAdmin(value) {
  setLocalAdminOverride(value)
  // Navigate away and back to re-evaluate guard if needed
}

function clearOverride() {
  setLocalAdminOverride(null)
}
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}
.screen {
  min-height: 100vh;
  background: #2f8b60;
  display: flex;
  flex-direction: column;
}
.panel {
  background: #fff;
  margin: 20px 16px 100px 16px;
  border-radius: 18px;
  padding: 16px;
}
.panel-header {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
}
.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}
.title-wrap {
  display: flex;
  flex-direction: column;
}
.title-lg {
  font-weight: 700;
  font-size: 24px;
  margin: 0;
}
.sub {
  color: #7a8b99;
  margin-top: 6px;
}

.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}
.card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 16px;
}
.label {
  font-size: 12px;
  color: #789;
}
.value {
  font-weight: 700;
  font-size: 18px;
}

.section {
  margin-top: 16px;
}
.actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.btn {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
  cursor: pointer;
}
.btn.primary {
  background: #2f8b60;
  color: #fff;
  border-color: #2f8b60;
}
.muted {
  color: #7a8b99;
  margin-top: 8px;
}

.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  padding: 20px 24px;
  background: #fff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
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
  transition: all 0.2s;
}
.bottombar button.active {
  background: #2f8b60;
  color: #fff;
}
.bottombar img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
.bottombar button.active img {
  filter: brightness(0) invert(1);
}
</style>
