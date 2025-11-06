<template>
  <div class="splash">
    <div class="content">
      <div class="logo">
        <div class="leaf-icon">
          <img src="/leaf.png" alt="Leaf Logo" />
        </div>
      </div>
      <h1 class="title">RAMIE</h1>
      <p class="subtitle">Simplify & Track</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  // Auto-navigate to first onboarding screen after 2 seconds
  setTimeout(() => {
    router.push({ name: 'onboarding-1' })
  }, 2000)
})
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.splash {
  min-height: 100vh;
  background: #2f8b60;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 20px;
}

.content {
  text-align: center;
  max-width: 400px; /* Increased from 300px */
  width: 100%;
}

.logo {
  margin-bottom: 32px; /* Increased from 20px */
}

.leaf-icon {
  width: 120px; /* Increased from 60px */
  height: 120px; /* Increased from 60px */
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.leaf-icon img {
  width: 64px; /* Increased from 32px */
  height: 64px; /* Increased from 32px */
  object-fit: contain;
}

.title {
  font-size: 42px; /* Increased from 28px */
  font-weight: 700;
  margin: 0 0 12px 0; /* Increased bottom margin */
  letter-spacing: 1px;
}

.subtitle {
  font-size: 18px; /* Increased from 14px */
  margin: 0;
  opacity: 0.9;
}

/* Mobile adjustments */
@media (max-width: 420px) {
  .splash {
    padding: 20px;
  }

  .leaf-icon {
    width: 140px; /* Increased from 100px */
    height: 140px; /* Increased from 100px */
  }

  .leaf-icon img {
    width: 80px; /* Increased from 40px */
    height: 80px; /* Increased from 40px */
  }

  .title {
    font-size: 36px; /* Increased from 24px */
  }

  .subtitle {
    font-size: 16px; /* Increased from 13px */
  }
}
</style>
