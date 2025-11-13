<template>
  <div class="forbidden-page">
    <div class="container">
      <div class="error-icon">
        <i class="mdi mdi-lock-alert"></i>
      </div>

      <h1 class="error-title">Access Denied</h1>
      <p class="error-message">
        You don't have permission to access this feature. This area is restricted to administrators
        only.
      </p>

      <div class="actions">
        <button @click="goToDashboard" class="btn-primary">
          <i class="mdi mdi-home"></i>
          Go to Dashboard
        </button>
        <button @click="goBack" class="btn-secondary">
          <i class="mdi mdi-arrow-left"></i>
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToDashboard() {
  router.replace({ name: 'dashboard' })
}

function goBack() {
  router.go(-1)
}
</script>

<style scoped>
* {
  font-family: 'Quicksand', sans-serif;
}

.forbidden-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  background: white;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-icon {
  margin-bottom: 24px;
}

.error-icon i {
  font-size: 80px;
  color: #e74c3c;
}

.error-title {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
}

.error-message {
  font-size: 16px;
  color: #7f8c8d;
  line-height: 1.6;
  margin-bottom: 32px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.btn-primary {
  background: #2f8b60;
  color: white;
}

.btn-primary:hover {
  background: #256c3c;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(47, 139, 96, 0.3);
}

.btn-secondary {
  background: #ecf0f1;
  color: #2c3e50;
  border: 1px solid #bdc3c7;
}

.btn-secondary:hover {
  background: #d5dbdb;
  transform: translateY(-2px);
}

.help-text {
  padding-top: 20px;
  border-top: 1px solid #ecf0f1;
  text-align: left;
}

.help-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
}

.help-description {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 16px 0;
}

.help-steps {
  text-align: left;
  padding-left: 20px;
  margin: 0 0 16px 0;
}

.help-steps li {
  font-size: 13px;
  color: #7f8c8d;
  margin-bottom: 8px;
  line-height: 1.5;
}

.help-steps code {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #2f8b60;
  border: 1px solid #e9ecef;
}

.help-footer {
  font-size: 13px;
  color: #95a5a6;
  margin: 0;
  text-align: center;
}

.help-footer strong {
  color: #2f8b60;
}

@media (max-width: 480px) {
  .container {
    padding: 24px;
  }

  .error-title {
    font-size: 24px;
  }

  .actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}
</style>
