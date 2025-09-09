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
      @click="$router.push({ name: 'make-feeds' })"
      :class="{ active: $route.name === 'make-feeds' }"
    >
      <img src="/makefeeds.png" alt="Make Feeds" />
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
  margin-top: auto;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 14px 18px;
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
  padding: 8px;
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
  width: 28px;
  height: 28px;
  object-fit: contain;
  transition: filter 0.2s ease-in-out;
}
</style>
