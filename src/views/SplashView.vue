<template>
  <div class="splash">
    <div class="content">
      <div class="logo">
        <div class="leaf-icon">🌿</div>
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
  max-width: 300px;
  width: 100%;
}

.logo {
  margin-bottom: 20px;
}

.leaf-icon {
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  margin: 0 auto;
  color: #2f8b60;
}

.title {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 6px 0;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

/* Mobile adjustments */
@media (max-width: 420px) {
  .splash {
    padding: 16px;
  }

  .leaf-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }

  .title {
    font-size: 24px;
  }

  .subtitle {
    font-size: 13px;
  }
}
</style>
