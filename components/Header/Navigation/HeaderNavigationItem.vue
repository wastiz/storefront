<template>
    <a
        class="nav-item"
        :href="link"
        :data-index="dataIndex"
        :aria-haspopup="hasChildren"
        tabindex="1"
    >
        <span class="nav-item-label">{{ label }}</span>
        <span v-if="hasChildren" class="dropdown-icon">▼</span>
    </a>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api';

export default defineComponent({
    name: 'HeaderNavigationItem',
    props: {
        label: {
            type: String,
            default: '',
        },
        link: {
            type: String,
            default: '',
        },
        hasChildren: {
            type: Boolean,
            default: false,
        },
        dataIndex: {
            type: Number,
            default: 0,
        },
    },
});
</script>

<style lang="scss" scoped>
.nav-item {
    color: white;
    text-decoration: none;
    padding: 0 15px;
    height: 100%;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 500;
    transition: background-color 0.2s;
    white-space: nowrap;

    &:hover {
        background-color: #1b5e20;
    }

    .dropdown-icon {
        font-size: 10px;
        margin-left: 5px;
    }
}
</style>
