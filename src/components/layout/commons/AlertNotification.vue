<script setup>
const props = defineProps(['formSuccessMessage', 'formErrorMessage'])
</script>

<template>
  <div v-if="props.formSuccessMessage" class="alert alert-success" role="alert">
    <div class="alert-title">Success!</div>
    <div class="alert-text">{{ props.formSuccessMessage }}</div>
    <button class="close" @click="$emit('close-success')">×</button>
  </div>

  <div v-if="props.formErrorMessage" class="alert alert-error" role="alert">
    <div class="alert-title">Ooops!</div>
    <div class="alert-text">{{ props.formErrorMessage }}</div>
    <button class="close" @click="$emit('close-error')">×</button>
  </div>
</template>

<style scoped>
.alert { display: grid; grid-template-columns: 1fr auto; gap: 8px; align-items: start; padding: 10px 12px; border-radius: 8px; margin: 8px 0; font-size: 14px; }
.alert-title { font-weight: 700; margin-bottom: 4px; }
.alert-text { grid-column: 1 / -1; }
.alert-success { background: #e8f5e9; color: #1b5e20; border-left: 4px solid #2e7d32; }
.alert-error { background: #ffebee; color: #b71c1c; border-left: 4px solid #c62828; }
.close { background: transparent; border: none; color: inherit; font-size: 18px; cursor: pointer; padding: 0 4px; line-height: 1; }
</style>
