<template>
    <div
        v-if="hasChildren(currentCategory)"
        class="subcategories-panel"
        @mouseenter="keepSubmenuOpen"
        @mouseleave="$emit('hideSubcategories')"
    >
        <div class="subcategories-container">
            <div
                v-for="(catLvl1, idxLvl1) in currentCategory.children"
                :key="idxLvl1"
                class="subcategory-column"
                ref="lvl1CatRefs"
            >
                <a
                    class="subcategory-title"
                    :href="localePath(getCatLink(catLvl1))"
                    @click="$emit('hideSubcategories')"
                    @focus="setupNav()"
                    @keydown.right.prevent="navRight()"
                    @keydown.left.prevent="navLeft()"
                    @keydown.down.prevent="navDown()"
                    @keydown.up.prevent="navUp()"
                >
                    {{ catLvl1.name }}
                </a>

                <div v-if="hasChildren(catLvl1)" class="subcategory-items">
                    <a
                        v-for="(catLvl2, idxLvl2) in catLvl1.children"
                        :key="idxLvl2"
                        class="subcategory-item"
                        :href="localePath(getCatLink(catLvl2))"
                        ref="lvl2CatRefs"
                        tabindex="-1"
                        @click="$emit('hideSubcategories')"
                        @keydown.down.prevent="navDown()"
                        @keydown.up.prevent="navUp()"
                        @keydown.right.prevent="navRight()"
                        @keydown.left.prevent="navLeft()"
                    >
                        {{ catLvl2.name }}
                    </a>

                    <div v-if="hasChildren(catLvl2)" class="sub-submenu">
                        <a
                            v-for="(catLvl3, idxLvl3) in catLvl2.children"
                            :key="idxLvl3"
                            class="sub-submenu-item"
                            :href="localePath(getCatLink(catLvl3))"
                            @click="$emit('hideSubcategories')"
                        >
                            {{ catLvl3.name }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from '@nuxtjs/composition-api';
import type { PropType } from '@nuxtjs/composition-api';
import type { CategoryTree } from '~/modules/GraphQL/types';
import { useUiHelpers } from '~/composables';
import type { ComponentTemplateRef } from '~/types/componentTemplateRef';

export default defineComponent({
    name: 'HeaderNavigationSubcategories',
    props: {
        currentCategory: {
            type: Object as PropType<CategoryTree | null>,
            default: () => null,
        },
        hasFocus: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, { emit }) {
        const { getCatLink } = useUiHelpers();
        const lvl1CatRefs = ref<HTMLElement[]>([]);
        const lvl2CatRefs = ref<HTMLElement[]>([]);
        const lvl2GroupedCatRefs = ref<HTMLElement[][]>([]);

        const hasChildren = (category: CategoryTree) => Boolean(category?.children?.length);

        const getGroupedLvl2CatRefs = (): HTMLElement[][] => {
            let current = 0;
            const result: HTMLElement[][] = [];
            lvl1CatRefs.value.forEach((lvl1CatRef) => {
                const childrenCount = lvl1CatRef.nextElementSibling?.children.length || 0;
                const group = lvl2CatRefs.value.slice(current, current + childrenCount);
                result.push(group);
                current += childrenCount;
            });
            return result;
        };

        let lvl1CatFocusIdx = 0;
        let lvl2CatFocusIdx = -1;

        const navRight = () => {
            if (lvl1CatRefs.value[++lvl1CatFocusIdx]) {
                lvl1CatRefs.value[lvl1CatFocusIdx].focus();
                lvl2CatFocusIdx = -1;
                lvl2GroupedCatRefs.value = getGroupedLvl2CatRefs();
            } else {
                lvl1CatFocusIdx--;
            }
        };

        const navLeft = () => {
            if (lvl1CatRefs.value[--lvl1CatFocusIdx]) {
                lvl1CatRefs.value[lvl1CatFocusIdx].focus();
                lvl2CatFocusIdx = -1;
                lvl2GroupedCatRefs.value = getGroupedLvl2CatRefs();
            } else {
                lvl1CatFocusIdx++;
            }
        };

        const navDown = () => {
            lvl2CatFocusIdx++;
            if (lvl2CatFocusIdx !== -1 && !lvl2GroupedCatRefs.value[lvl1CatFocusIdx][lvl2CatFocusIdx]) {
                lvl2CatFocusIdx--;
                return;
            }
            lvl2GroupedCatRefs.value[lvl1CatFocusIdx][lvl2CatFocusIdx].focus();
        };

        const navUp = () => {
            if (lvl2CatFocusIdx > 0) {
                lvl2CatFocusIdx--;
                lvl2GroupedCatRefs.value[lvl1CatFocusIdx][lvl2CatFocusIdx].focus();
                return;
            }

            if (lvl2CatFocusIdx === 0) {
                lvl1CatRefs.value[lvl1CatFocusIdx].focus();
                lvl2CatFocusIdx = -1;
                return;
            }

            if (lvl2CatFocusIdx === -1) {
                emit('hideSubcategories');
            }
        };

        const setupNav = () => {
            lvl2CatFocusIdx = -1;
            lvl1CatRefs.value[lvl1CatFocusIdx].focus();
            lvl2GroupedCatRefs.value = getGroupedLvl2CatRefs();
        };

        const keepSubmenuOpen = () => {
            // Метод для удержания подменю открытым при наведении
        };

        onMounted(() => {
            if (props.hasFocus) {
                setupNav();
            }
        });

        return {
            getCatLink,
            hasChildren,
            navRight,
            navLeft,
            navDown,
            navUp,
            setupNav,
            keepSubmenuOpen,
            lvl1CatRefs,
            lvl2CatRefs,
        };
    },
});
</script>

<style lang="scss" scoped>
.subcategories-panel {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1);
    z-index: 100;
    padding: 20px;
}

.subcategories-container {
    display: flex;
    flex-wrap: wrap;
    gap: 30px;
    max-width: 1200px;
    margin: 0 auto;
}

.subcategory-column {
    flex: 1;
    min-width: 200px;
}

.subcategory-title {
    display: block;
    color: #2e7d32;
    font-weight: bold;
    margin-bottom: 10px;
    text-decoration: none;
    font-size: 15px;

    &:hover {
        text-decoration: underline;
    }
}

.subcategory-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.subcategory-item {
    color: #333;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.2s;

    &:hover {
        color: #2e7d32;
        text-decoration: underline;
    }
}

.sub-submenu {
    margin-top: 5px;
    padding-left: 15px;
    border-left: 1px solid #eee;
}

.sub-submenu-item {
    display: block;
    color: #666;
    text-decoration: none;
    font-size: 13px;
    padding: 5px 0;

    &:hover {
        color: #2e7d32;
    }
}
</style>
