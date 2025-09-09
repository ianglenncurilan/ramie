<template>
  <div class="onboarding">
    <div class="content">
      <div class="illustration">
        <div v-if="currentStep === 1" class="simplify-illustration">
          <div class="arrow">↗</div>
        </div>
        <div v-else-if="currentStep === 2" class="expense-illustration">
          <div class="money-stack">💰</div>
          <div class="coins">🪙</div>
          <div class="pin">📍</div>
        </div>
        <div v-else-if="currentStep === 3" class="manage-illustration">
          <div class="bulb">💡</div>
          <div class="clipboard">📋</div>
          <div class="chart">📊</div>
          <div class="gear">⚙️</div>
        </div>
      </div>

      <h2 class="title">{{ titles[currentStep - 1] }}</h2>
    </div>

    <div class="navigation">
      <button class="skip" @click="goToLogin">Skip</button>

      <div class="dots">
        <div v-for="i in 3" :key="i" class="dot" :class="{ active: i === currentStep }"></div>
      </div>

      <button class="next" @click="nextStep">
        {{ currentStep === 3 ? 'Get Started' : 'Next' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentStep = ref(1)

const titles = ['Simplify', 'Track Expense', 'Manage']

const nextStep = () => {
  if (currentStep.value === 3) {
    goToLogin()
  } else {
    currentStep.value++
  }
}

const goToLogin = () => {
  router.push({ name: 'login' })
}
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.onboarding {
  min-height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 16px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px 0;
}

.illustration {
  width: 160px;
  height: 160px;
  margin-bottom: 30px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simplify-illustration .arrow {
  font-size: 80px;
  color: #ff6a6a;
  transform: rotate(45deg);
}

.expense-illustration {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.money-stack {
  font-size: 50px;
}

.coins {
  font-size: 35px;
  margin-left: 15px;
}

.pin {
  font-size: 25px;
  margin-top: -8px;
}

.manage-illustration {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  align-items: center;
  justify-items: center;
}

.bulb,
.clipboard,
.chart,
.gear {
  font-size: 35px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.navigation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 0 10px;
  margin-top: 20px;
}

.skip {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  padding: 10px 16px;
  justify-self: start;
}

.next {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  padding: 10px 16px;
  justify-self: end;
}

.dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e0e0e0;
  transition: background 0.3s ease;
}

.dot.active {
  background: #2f8b60;
}

/* Mobile adjustments */
@media (max-width: 420px) {
  .onboarding {
    padding: 16px 12px;
  }

  .illustration {
    width: 140px;
    height: 140px;
    margin-bottom: 25px;
  }

  .simplify-illustration .arrow {
    font-size: 70px;
  }

  .money-stack {
    font-size: 45px;
  }

  .coins {
    font-size: 30px;
    margin-left: 12px;
  }

  .pin {
    font-size: 22px;
    margin-top: -6px;
  }

  .bulb,
  .clipboard,
  .chart,
  .gear {
    font-size: 30px;
  }

  .title {
    font-size: 24px;
  }

  .navigation {
    padding: 0 5px;
  }

  .skip,
  .next {
    font-size: 13px;
    padding: 8px 12px;
  }

  .dots {
    gap: 5px;
  }

  .dot {
    width: 5px;
    height: 5px;
  }
}
</style>
