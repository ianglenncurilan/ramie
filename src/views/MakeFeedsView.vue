<template>
  <div class="screen">
    <section class="panel">
      <div class="panel-header">
        <button class="back" @click="$router.back()">←</button>
        <div class="title-wrap">
          <h2 class="title-lg">Make Feeds</h2>
          <p class="sub">Make feeds according to your hogs' stage</p>
        </div>
        <img class="panel-illustration" src="/makefeeds.png" alt="icon" />
      </div>

      <div class="list">
        <button class="row" @click="$router.push({ name: 'starter-feed-calculator' })">
          <img class="thumb" src="/starter.png" alt="starter" />
          <div class="col">
            <div class="title">Starter</div>
            <div class="muted">60% Protein / 40% Carbs</div>
            <div class="muted">60–90 Days</div>
          </div>
          <span class="chev">›</span>
        </button>
        <button class="row" @click="$router.push({ name: 'grower-feed-calculator' })">
          <img class="thumb" src="/grower.png" alt="grower" />
          <div class="col">
            <div class="title">Grower</div>
            <div class="muted">50% Protein / 50% Carbs</div>
            <div class="muted">90–120 Days</div>
          </div>
          <span class="chev">›</span>
        </button>
        <button class="row" @click="$router.push({ name: 'finisher-feed-calculator' })">
          <img class="thumb" src="/finsher.png" alt="finisher" />
          <div class="col">
            <div class="title">Finisher</div>
            <div class="muted">40% Protein / 60% Carbs</div>
            <div class="muted">120–150 Days</div>
          </div>
          <span class="chev">›</span>
        </button>
      </div>
    </section>
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
  max-width: 1200px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
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
  margin-bottom: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  padding-top: 4px;
}
.sub {
  color: #7a8b99;
  margin-top: 6px;
}
.list {
  display: grid;
  gap: 20px;
  margin-top: 24px;
  max-width: 100%;
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
  font-size: 13px;
  line-height: 1.2;
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

/* Mobile Small (320px - 374px) */
@media (max-width: 374px) {
  .panel {
    margin: 8px 8px;
    padding: 16px;
    padding-top: 24px;
    width: 100%;
  }
  .panel-header {
    gap: 8px;
  }
  .back {
    width: 32px;
    height: 32px;
    font-size: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .panel-illustration {
    width: 48px;
    height: 48px;
  }
  .title-lg {
    font-size: 20px;
  }
  .sub {
    font-size: 13px;
  }
  .list {
    gap: 12px;
    margin-top: 16px;
    max-width: 100%;
  }
  .row {
    padding: 16px 12px;
    gap: 10px;
    border-radius: 14px;
  }
  .thumb {
    width: 40px;
    height: 40px;
    border-radius: 10px;
  }
  .title {
    font-size: 14px;
    margin-bottom: 2px;
  }
  .muted {
    font-size: 11px;
    line-height: 1.1;
  }
  .chev {
    width: 28px;
    height: 28px;
    font-size: 16px;
  }
}

/* Mobile Medium (375px - 424px) */
@media (min-width: 375px) and (max-width: 424px) {
  .panel {
    margin: 10px 10px;
    padding: 18px;
    padding-top: 26px;
    width: 100%;
  }
  .panel-header {
    gap: 10px;
  }
  .back {
    width: 32px;
    height: 34px;
    font-size: 18px;
  }
  .panel-illustration {
    width: 52px;
    height: 52px;
  }
  .title-lg {
    font-size: 22px;
  }
  .sub {
    font-size: 14px;
  }
  .list {
    gap: 14px;
    margin-top: 18px;
    max-width: 100%;
  }
  .row {
    padding: 18px 16px;
    gap: 12px;
    border-radius: 16px;
  }
  .thumb {
    width: 44px;
    height: 44px;
    border-radius: 11px;
  }
  .title {
    font-size: 15px;
    margin-bottom: 3px;
  }
  .muted {
    font-size: 12px;
    line-height: 1.15;
  }
  .chev {
    width: 32px;
    height: 32px;
    font-size: 18px;
  }
}

/* Mobile Large (425px - 767px) */
@media (min-width: 425px) and (max-width: 767px) {
  .panel {
    margin: 12px 12px;
    padding: 20px;
    padding-top: 28px;
    width: 100%;
  }
  .panel-header {
    gap: 12px;
  }
  .back {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
  .panel-illustration {
    width: 56px;
    height: 56px;
  }
  .title-lg {
    font-size: 24px;
  }
  .sub {
    font-size: 14px;
  }
  .list {
    gap: 16px;
    margin-top: 20px;
    max-width: 100%;
  }
  .row {
    padding: 20px 18px;
    gap: 14px;
    border-radius: 17px;
  }
  .thumb {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }
  .title {
    font-size: 16px;
    margin-bottom: 4px;
  }
  .muted {
    font-size: 13px;
    line-height: 1.2;
  }
  .chev {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .panel {
    margin: 14px 14px;
    padding: 24px;
    padding-top: 32px;
    max-width: 768px;
    margin-left: auto;
    margin-right: auto;
  }
  .panel-illustration {
    width: 64px;
    height: 64px;
  }
  .title-lg {
    font-size: 26px;
  }
  .list {
    gap: 18px;
    margin-top: 24px;
    max-width: 100%;
  }
  .row {
    padding: 28px 24px;
    gap: 16px;
  }
  .thumb {
    width: 56px;
    height: 56px;
  }
  .title {
    font-size: 18px;
  }
  .muted {
    font-size: 14px;
  }
  .chev {
    width: 40px;
    height: 40px;
    font-size: 22px;
  }
}

/* Small Desktop (1024px - 1439px) */
@media (min-width: 1024px) and (max-width: 1439px) {
  .panel {
    margin: 16px 16px;
    padding: 28px;
    padding-top: 36px;
    max-width: 1024px;
    margin-left: auto;
    margin-right: auto;
  }
  .panel-illustration {
    width: 72px;
    height: 72px;
  }
  .title-lg {
    font-size: 28px;
  }
  .list {
    gap: 20px;
    margin-top: 28px;
    max-width: 100%;
  }
  .row {
    padding: 32px 28px;
    gap: 18px;
  }
  .thumb {
    width: 64px;
    height: 64px;
  }
  .title {
    font-size: 20px;
  }
  .muted {
    font-size: 15px;
  }
  .chev {
    width: 44px;
    height: 44px;
    font-size: 24px;
  }
}

/* Large Desktop (1440px+) */
@media (min-width: 1440px) {
  .panel {
    margin: 18px 18px;
    padding: 32px;
    padding-top: 40px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }
  .panel-illustration {
    width: 80px;
    height: 80px;
  }
  .title-lg {
    font-size: 30px;
  }
  .list {
    gap: 22px;
    margin-top: 32px;
    max-width: 100%;
  }
  .row {
    padding: 36px 32px;
    gap: 20px;
  }
  .thumb {
    width: 72px;
    height: 72px;
  }
  .title {
    font-size: 22px;
  }
  .muted {
    font-size: 16px;
  }
  .chev {
    width: 48px;
    height: 48px;
    font-size: 26px;
  }
}
</style>
