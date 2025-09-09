<template>
  <div class="screen">
    <section class="hero">
      <div class="header">
        <h2>Make Feeds</h2>
        <img src="/favicon.ico" alt="icon" />
      </div>
      <p class="sub">Make feeds according to your hogs' stage</p>
    </section>

    <div class="list">
      <button
        class="row"
        @click="$router.push({ name: 'feed-calculator', params: { stage: 'starter' } })"
      >
        <img class="thumb" src="/pig.jpg" alt="starter" />
        <div class="col">
          <div class="title">Starter</div>
          <div class="muted">60–90 Days</div>
        </div>
        <span class="action">⟩</span>
      </button>
      <button
        class="row"
        @click="$router.push({ name: 'feed-calculator', params: { stage: 'grower' } })"
      >
        <img class="thumb" src="/pig.jpg" alt="grower" />
        <div class="col">
          <div class="title">Grower</div>
          <div class="muted">90–120 Days</div>
        </div>
        <span class="action">⟩</span>
      </button>
      <button
        class="row"
        @click="$router.push({ name: 'feed-calculator', params: { stage: 'finisher' } })"
      >
        <img class="thumb" src="/pig.jpg" alt="finisher" />
        <div class="col">
          <div class="title">Finisher</div>
          <div class="muted">120–150 Days</div>
        </div>
        <span class="action">⟩</span>
      </button>
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
  display: flex;
  flex-direction: column;
}
.hero {
  background: #2f8b60;
  color: #fff;
  margin: 16px;
  border-radius: 16px;
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header img {
  width: 60px;
  height: 60px;
}
.sub {
  opacity: 0.9;
  margin-top: 6px;
}
.list {
  background: #fff;
  margin: 0 16px;
  border-radius: 16px;
  padding: 8px;
}
.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  width: 100%;
}
.row:last-child {
  border-bottom: 0;
}
.thumb {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  object-fit: cover;
}
.title {
  font-weight: 600;
}
.muted {
  color: #789;
}
.action {
  color: #2f8b60;
  font-size: 22px;
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
