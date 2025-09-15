<template>
  <div class="onboarding">
    <div class="content">
      <div class="illustration">
        <div v-if="currentStep === 1" class="simplify-illustration">
          <img src="/simplify.png" alt="Simplify" />
        </div>
        <div v-else-if="currentStep === 2" class="track-illustration">
          <img src="/track.png" alt="Track" />
        </div>
        <div v-else-if="currentStep === 3" class="manage-illustration">
          <img src="/manage.png" alt="Manage" />
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
  height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px 16px;
  overflow: hidden;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 10px 0;
  min-height: 0;
}

.illustration {
  width: 140px;
  height: 140px;
  margin-bottom: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.simplify-illustration img,
.track-illustration img,
.manage-illustration img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-width: 140px;
  max-height: 140px;
}

.title {
  font-size: 24px;
  font-weight: 700;
  color: #000;
  margin: 0;
  flex-shrink: 0;
}

.navigation {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 15px 20px;
  margin-top: 15px;
  flex-shrink: 0;
}

.skip {
  background: none;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  padding: 15px 20px;
  justify-self: start;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.skip:hover {
  background-color: #f5f5f5;
}

.next {
  background: #2f8b60;
  border: none;
  font-size: 16px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  padding: 15px 20px;
  justify-self: end;
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.next:hover {
  background-color: #256c3c;
}

.dots {
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
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
    padding: 8px 10px;
  }

  .content {
    padding: 5px 0;
  }

  .illustration {
    width: 100px;
    height: 100px;
    margin-bottom: 10px;
  }

  .simplify-illustration img,
  .track-illustration img,
  .manage-illustration img {
    max-width: 100px;
    max-height: 100px;
  }

  .title {
    font-size: 18px;
  }

  .navigation {
    padding: 8px 10px;
    margin-top: 8px;
  }

  .skip,
  .next {
    font-size: 13px;
    padding: 10px 14px;
  }

  .dots {
    gap: 5px;
  }

  .dot {
    width: 5px;
    height: 5px;
  }
}

/* Extra small mobile adjustments */
@media (max-width: 360px) {
  .onboarding {
    padding: 6px 8px;
  }

  .content {
    padding: 3px 0;
  }

  .illustration {
    width: 80px;
    height: 80px;
    margin-bottom: 8px;
  }

  .simplify-illustration img,
  .track-illustration img,
  .manage-illustration img {
    max-width: 80px;
    max-height: 80px;
  }

  .title {
    font-size: 16px;
  }

  .navigation {
    padding: 6px 8px;
    margin-top: 6px;
  }

  .skip,
  .next {
    font-size: 12px;
    padding: 8px 12px;
  }

  .dots {
    gap: 4px;
  }

  .dot {
    width: 4px;
    height: 4px;
  }
}
</style>
