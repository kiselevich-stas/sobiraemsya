<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  disabled: false,
});
</script>

<template>
  <button class="app-button" :class="`app-button--${variant}`" :type="type" :disabled="disabled">
    <slot />
  </button>
</template>
