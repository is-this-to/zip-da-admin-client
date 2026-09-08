<script setup>
import { computed } from "vue";

const model = defineModel();
const isShowPassword = defineModel("isShowPassword");

const props = defineProps({
  inputType: {
    type: String,
    default: "text",

    
  },
  required: {
    type: Boolean,
    default: false,
  },
  content: String,
  placeholder: String,
  authComplete: String,
  backgroundColor: String,
  isPassWord: {
    type: Boolean,
    default: false,
  },
});

const resultInputType = computed(() => {
  if (!props.isPassWord) return props.inputType;
  return isShowPassword.value ? "text" : "password";
});
</script>

<template>
  <label class="field-group">
    <span :class="{ required: props.required }">{{ props.content }}</span>
    <div class="input-field">
      <input
        v-model="model"
        :type="resultInputType"
        :autocomplete="props.authComplete"
        :placeholder="props.placeholder"
        :required="props.required"
      />
      <button
        type="button"
        v-if="isPassWord"
        @click="isShowPassword = !isShowPassword"
      >
        {{ isShowPassword ? "숨김" : "보기" }}
      </button>
    </div>
  </label>
</template>

<style scoped>
.field-group {
  display: block;
  margin-top: 20px;
}

.field-group > span {
  display: block;
  margin-bottom: 5px;
  color: #202b3d;
  font-size: 15px;
  font-weight: 800;
}

.field-group > span.required {
  color: #e73431cb;
}

.field-group input {
  width: 100%;
  height: 48px;
  border: 1px solid #e3e8f2;
  border-radius: 18px;
  outline: 0;
  padding: 0 18px;
  color: #101828;
  font-size: 16px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
  background: #ffffff;
}

.field-group input:focus {
  border-color: #0057e78c;
  box-shadow: 0 0 0 4px #0057e71a;
}

.input-field {
  position: relative;
}

.input-field input {
  padding-right: 76px;
}

.input-field button {
  position: absolute;
  top: 50%;
  right: 10px;
  height: 38px;
  min-width: 54px;
  transform: translateY(-50%);
  border: 0;
  border-radius: 12px;
  color: var(--personal-color-blue);
  background: #eaf1ff;
  font-weight: 900;
  cursor: pointer;
}
</style>
