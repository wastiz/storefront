<template>
    <div class="header-navigation" @mouseleave="setCurrentCategory(null)">
        <div class="navigation-bar">
            <HeaderNavigationItem
                v-for="(category, index) in categoryTree"
                :key="index"
                ref="lvl0CatRefs"
                :label="category.name"
                :link="localePath(getCatLink(category))"
                :has-children="hasChildren(category)"
                :data-index="index"
                @mouseenter.native="onMouseEnter(category)"
                @keydown.down.native.prevent="setCurrentCategory(category)"
                @keydown.up.native.prevent="setCurrentCategory(null)"
                @keyup.tab.native.prevent="setFocus($event)"
                @keydown.right.native.prevent="navRight()"
                @keydown.left.native.prevent="navLeft()"
            />
        </div>

        <HeaderNavigationSubcategories
            v-if="hasChildren(currentCategory)"
            :current-category="currentCategory"
            :has-focus="hasFocus"
            @hideSubcategories="focusRootElementAndHideSubcategories"
        />
    </div>
</template>

<script lang="ts">
import {
    defineComponent, PropType, ref,
} from '@nuxtjs/composition-api';
import { CategoryTree } from '~/modules/GraphQL/types';
import { useUiHelpers } from '~/composables';
import type { ComponentTemplateRef } from '~/types/componentTemplateRef';
import HeaderNavigationItem from './HeaderNavigationItem.vue';

export default defineComponent({
    name: 'HeaderNavigation',
    components: {
        HeaderNavigationSubcategories: () => import('./HeaderNavigationSubcategories.vue'),
        HeaderNavigationItem,
    },
    props: {
        categoryTree: {
            type: Array as PropType<CategoryTree[]>,
            default: () => [],
        },
    },
    setup() {
        const { getCatLink } = useUiHelpers();

        const currentCategory = ref<CategoryTree | null>(null);
        const lvl0CatRefs = ref<ComponentTemplateRef[]>();
        const hasFocus = ref(false);
        let lvl0CatFocusIdx = 0;
        let focusedElement: HTMLElement | null = null;

        const setCurrentCategory = (category: CategoryTree | null) => {
            currentCategory.value = category;
        };

        const hasChildren = (category: CategoryTree) => Boolean(category?.children?.length);

        const setFocus = (event: MouseEvent & { target: HTMLElement }) => {
            focusedElement = event.target;
            lvl0CatFocusIdx = Number(event.target.dataset.index);
            hasFocus.value = true;
        };

        const focusRootElementAndHideSubcategories = () => {
            setCurrentCategory(null);
            if (focusedElement !== null) focusedElement.focus();
        };

        const navRight = () => {
            lvl0CatFocusIdx++;
            if (lvl0CatRefs.value && lvl0CatRefs.value[lvl0CatFocusIdx]) {
                lvl0CatRefs.value[lvl0CatFocusIdx].$el.focus();
                focusedElement = lvl0CatRefs.value[lvl0CatFocusIdx].$el;
            } else {
                lvl0CatFocusIdx--;
            }
        };

        const navLeft = () => {
            lvl0CatFocusIdx--;
            if (lvl0CatRefs.value && lvl0CatRefs.value[lvl0CatFocusIdx]) {
                lvl0CatRefs.value[lvl0CatFocusIdx].$el.focus();
                focusedElement = lvl0CatRefs.value[lvl0CatFocusIdx].$el;
            } else {
                lvl0CatFocusIdx++;
            }
        };

        const onMouseEnter = (category: CategoryTree) => {
            currentCategory.value = category;
            focusedElement = null;
            hasFocus.value = false;
        };

        return {
            getCatLink,
            setCurrentCategory,
            currentCategory,
            hasChildren,
            setFocus,
            focusRootElementAndHideSubcategories,
            lvl0CatRefs,
            navRight,
            navLeft,
            hasFocus,
            onMouseEnter,
        };
    },
});
</script>

<style lang="scss" scoped>
.header-navigation {
    position: relative;
    width: 100%;
}

.navigation-bar {
    display: flex;
    background-color: var(--button-background, var(--c-primary));
    height: 40px;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
    gap: 15px;
}
</style>
