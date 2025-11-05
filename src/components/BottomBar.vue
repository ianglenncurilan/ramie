<template>
  <nav class="bottombar">
    <button
      @click="$router.push({ name: 'dashboard' })"
      :class="{ active: $route.name === 'dashboard' }"
    >
      <img src="/home.png" alt="Home" />
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
      @click="$router.push({ name: 'profile' })"
      :class="{ active: $route.name === 'profile' }"
    >
      <img src="/profile.png" alt="Profile" />
    </button>
  </nav>
</template>

<style scoped>
.bottombar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  justify-content: space-around;
  padding: 10px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.bottombar button {
  background: none;
  border: none;
  padding: 8px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #666;
  font-size: 12px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.bottombar button img {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  opacity: 0.7;
  transition: all 0.2s;
}

.bottombar button.active {
  color: #2f8b60;
}

.bottombar button.active img {
  opacity: 1;
  filter: brightness(0) saturate(100%) invert(42%) sepia(65%) saturate(441%) hue-rotate(112deg)
    brightness(90%) contrast(85%);
}
</style>
