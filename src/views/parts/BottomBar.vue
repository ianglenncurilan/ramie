<template>
  <nav class="bottombar">
    <button @click="$router.push({ name: 'dashboard' })">🏠</button>
    <button @click="$router.push({ name: 'records' })">📋</button>
    <button class="fab">＋</button>
    <button @click="$router.push({ name: 'expenses' })">💬</button>
    <button @click="$router.push({ name: 'profile' })">👤</button>
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
}
.fab {
  background: #2f8b60;
  color: #fff;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  justify-self: center;
}
button {
  cursor: pointer;
}
</style>
