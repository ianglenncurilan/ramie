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

    <BottomBar />
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
</style>
