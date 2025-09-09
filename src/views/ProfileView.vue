<template>
  <div class="screen">
    <section class="hero">
      <img src="/pig.jpg" alt="hero" />
    </section>
    <div class="panel">
      <div class="avatar">👤</div>
      <div class="name">Olivier Terante</div>
      <div class="role">Hog Raiser</div>

      <div class="menu">
        <button class="row">
          <span>Edit Profile</span>
          <span>›</span>
        </button>
        <button class="row">
          <span>Change Password</span>
          <span>›</span>
        </button>
        <button class="signout">Sign out</button>
      </div>
    </div>
    <nav class="bottombar">
      <button @click="go('dashboard')">
        <img src="/home.png" alt="Dashboard" />
      </button>
      <button @click="go('records')">
        <img src="/records.png" alt="Records" />
      </button>
      <button class="fab">
        <img src="/favicon.ico" alt="Add" />
      </button>
      <button @click="go('expenses')">
        <img src="/expensesicon.png" alt="Expenses" />
      </button>
      <button @click="go('profile')">
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>
  </div>
</template>

<script setup>
import BottomBar from './parts/BottomBar.vue'
</script>

<style scoped>
.screen {
  min-height: 100vh;
  background: #f5f5f5;
}
.hero {
  margin: 16px;
}
.hero img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 14px;
}
.panel {
  margin: 0 16px;
  background: #2f8b60;
  border-radius: 16px;
  padding: 18px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
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
  margin-top: -46px;
  border: 6px solid #2f8b60;
}
.name {
  font-weight: 700;
  margin-top: 10px;
}
.role {
  opacity: 0.9;
  margin-bottom: 14px;
}
.menu {
  width: 100%;
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
  width: 100%;
  background: #1f6b4a;
  color: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  margin-top: 10px;
}
button {
  cursor: pointer;
}
.bottombar {
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 14px 18px;
  background: #fff;
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
}
.bottombar button {
  display: flex;
  justify-content: center;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
}
.bottombar img {
  width: 28px; /* Set a consistent width for all icons */
  height: 28px; /* Set a consistent height for all icons */
  object-fit: contain; /* Ensure the image fits within the dimensions */
}
.fab {
  background: #2f8b60;
  color: #fff;
  border-radius: 50%;
  width: 56px; /* Increase FAB size for better visibility */
  height: 56px;
  justify-self: center;
  display: flex;
  justify-content: center;
  align-items: center;
}
.fab img {
  width: 24px; /* Adjust the size of the favicon inside the FAB */
  height: 24px;
}
</style>
