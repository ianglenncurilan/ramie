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
          <img class="thumb" src="/starter.png" alt="starter" />
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
          <img class="thumb" src="/grower.png" alt="grower" />
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
          <img class="thumb" src="/finsher.png" alt="finisher" />
          <div class="col">
            <div class="title">Finisher</div>
            <div class="muted">120–150 Days</div>
          </div>
          <span class="chev">›</span>
        </button>
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
        @click="$router.push({ name: 'profile' })"
        :class="{ active: $route.name === 'profile' }"
      >
        <img src="/profile.png" alt="Profile" />
      </button>
    </nav>
  </div>
</template>

<script setup>
// Removed BottomBar import - using inline navigation
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.screen {
  height: 100vh;
  background: #2f8b60;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel {
  background: #fff;
  margin: 12px 16px;
  border-radius: 18px;
  padding: 20px;
  flex: 1;
  overflow-y: auto;
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
  gap: 20px;
  margin-top: 24px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
.row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 32px 28px;
  width: 100%;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease-in-out;
}
.thumb {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
}
.title {
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 4px;
}
.muted {
  color: #7a8b99;
  font-size: 14px;
}
.chev {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: #2f8b6015;
  color: #2f8b60;
  border-radius: 999px;
  font-size: 24px;
}
button {
  cursor: pointer;
}

.row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: #2f8b60;
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
  .list {
    gap: 16px;
    margin-top: 20px;
    max-width: 100%;
  }
  .row {
    padding: 24px 20px;
    gap: 14px;
  }
  .thumb {
    width: 48px;
    height: 48px;
  }
  .title {
    font-size: 16px;
  }
  .muted {
    font-size: 13px;
  }
  .chev {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
}
</style>
