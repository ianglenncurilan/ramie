<template>
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
      <img src="/records.png" alt="Records" />
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
</template>

<script setup>
// No need to import useAuth since we're not using conditional rendering anymore
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.bottombar {
  margin-top: auto;
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
</style>
