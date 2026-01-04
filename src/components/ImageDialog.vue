<script setup>
import { computed } from 'vue';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    imageSrc: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: '图片展示'
    },
    width: {
        type: [Number, String],
        default: 650
    },
    height: {
        type: [Number, String],
        default: 650
    }
});

const emit = defineEmits(['update:visible']);

const isVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
});

const closeDialog = () => {
    isVisible.value = false;
};
</script>

<template>
    <div 
        v-if="isVisible" 
        class="image-dialog-overlay" 
        @click.self="closeDialog"
    >
        <div class="image-dialog" :style="{ width: typeof width === 'number' ? width + 'px' : width, height: typeof height === 'number' ? height + 'px' : height }">
            <div class="dialog-header">
                <h3 class="dialog-title">{{ title }}</h3>
                <span class="dialog-close" @click="closeDialog">×</span>
            </div>
            <div class="dialog-content">
                <div class="image-container">
                    <img 
                        :src="imageSrc" 
                        :alt="title" 
                        class="display-image" 
                        :style="{ 
                            width: typeof width === 'number' ? (width - 50) + 'px' : width, 
                            height: typeof height === 'number' ? (height - 50) + 'px' : height 
                        }" 
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
// 主题色变量
$theme-bg-color: rgb(21, 26, 45);
$theme-text-color: rgb(101, 171, 223);
$theme-button-color: rgb(26, 49, 116);
$theme-border-color: rgb(82, 103, 156);

.image-dialog-overlay {
    position: absolute;
    top: 50px;
    left: 50px;
    z-index: 2000;
}

.image-dialog {
    background-color: $theme-bg-color;
    border: 1px solid $theme-border-color;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    animation: slideIn 0.3s ease;
    overflow: hidden;
}

.dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid $theme-border-color;

    .dialog-title {
        margin: 0;
        color: $theme-text-color;
        font-size: 16px;
        font-weight: bold;
    }

    .dialog-close {
        color: $theme-text-color;
        font-size: 24px;
        cursor: pointer;
        line-height: 1;
        transition: color 0.3s ease;

        &:hover {
            color: lighten($theme-text-color, 20%);
        }
    }
}

.dialog-content {
    padding: 20px;
    flex: 1;
    color: $theme-text-color;
    overflow-y: auto;
}

.image-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;

    .display-image {
        object-fit: contain;
        border: 1px solid $theme-border-color;
        background-color: rgba(26, 49, 116, 0.3);
    }
}

@keyframes slideIn {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>

