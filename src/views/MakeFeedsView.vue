<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Make<br />Feeds</h2>
          <p class="sub">Make feeds according to your hogs' stage</p>
        </div>
        <img class="panel-illustration" src="/makefeeds.png" alt="icon" />
      </div>

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
          <span class="chev">›</span>
        </button>
        <button
          class="row"
          @click="$router.push({ name: 'feed-calculator', params: { stage: 'grower' } })"
        >
          <img class="thumb" src="/pig2.png" alt="grower" />
          <div class="col">
            <div class="title">Grower</div>
            <div class="muted">90–120 Days</div>
          </div>
          <span class="chev">›</span>
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
          <span class="chev">›</span>
        </button>
      </div>
    </section>

    <BottomBar />
  </div>
</template>

<script setup>
import BottomBar from './parts/BottomBar.vue'
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
  margin: 20px 16px;
  border-radius: 18px;
  padding: 32px;
  padding-top: 64px;
}
.panel-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
}
.back {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
}
.panel-illustration {
  width: 72px;
  height: 72px;
  object-fit: contain;
}
.title-wrap {
  display: flex;
  flex-direction: column;
}
.title-lg {
  font-weight: 700;
  font-size: 28px;
  line-height: 1.05;
  margin: 0;
}
.sub {
  color: #7a8b99;
  margin-top: 6px;
}
.list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}
.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
  padding: 24px;
  width: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 14px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.02);
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
  color: #7a8b99;
}
.chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  background: #2f8b6015;
  color: #2f8b60;
  border-radius: 999px;
  font-size: 22px;
}
button {
  cursor: pointer;
}

/* Mobile tweaks */
@media (max-width: 420px) {
  .panel {
    margin: 12px;
    padding: 20px;
    padding-top: 28px;
  }
  .panel-illustration {
    width: 56px;
    height: 56px;
  }
  .title-lg {
    font-size: 24px;
  }
  .row {
    padding: 12px;
    gap: 10px;
  }
  .thumb {
    width: 40px;
    height: 40px;
  }
}
</style>
