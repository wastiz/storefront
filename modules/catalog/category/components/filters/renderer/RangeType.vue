<template>
    <div class="range-filter">
        <SfHeading
            :key="`filter-title-${filter.attribute_code}`"
            :level="4"
            :title="filter.label"
            class="filters__title sf-heading--left"
        />

        <div class="slider-container">
            <div
                ref="slider"
                class="slider"
                :data-min="min"
                :data-max="max"
                :data-step="step"
            >
                <div ref="touchLeft" class="slider-touch slider-touch-left"><span></span></div>
                <div ref="touchRight" class="slider-touch slider-touch-right"><span></span></div>
                <div class="slider-line">
                    <span ref="lineSpan"></span>
                </div>
            </div>
        </div>

        <div class="range-filter__labels">
            <span>{{ currentMin }}</span>
            <span>{{ currentMax }}</span>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref, PropType } from '@nuxtjs/composition-api';
import { SfHeading } from '@storefront-ui/vue';
import type { Aggregation } from '~/modules/GraphQL/types';

export default defineComponent({
    name: 'RangeSlider',
    components: { SfHeading },
    props: {
        filter: {
            type: Object as PropType<Aggregation>,
            required: true,
        },
        rangeMin: Number,
        rangeMax: Number,
    },
    setup(props, { emit }) {
        const slider = ref<HTMLElement | null>(null);
        const touchLeft = ref<HTMLElement | null>(null);
        const touchRight = ref<HTMLElement | null>(null);
        const lineSpan = ref<HTMLElement | null>(null);

        const values = props.filter.options.map(opt => Number(opt.value)).sort((a, b) => a - b);
        const min = ref(Math.min(...values));
        const max = ref(Math.max(...values));
        const step = 1;

        const currentMin = ref(min.value);
        const currentMax = ref(max.value);

        const updateLabels = (leftVal: number, rightVal: number) => {
            currentMin.value = Math.min(leftVal, rightVal);
            currentMax.value = Math.max(leftVal, rightVal);

            // Можно добавить форматирование (например, для валюты)
            // currentMin.value = formatCurrency(Math.min(leftVal, rightVal));
            // currentMax.value = formatCurrency(Math.max(leftVal, rightVal));
        };

        const emitChangeEvent = () => {
            emit('selectFilter', {
                from: currentMin.value,
                to: currentMax.value
            });
        };

        onMounted(() => {
            if (!slider.value || !touchLeft.value || !touchRight.value || !lineSpan.value) return;

            const normalizeFact = 26;
            const sliderWidth = slider.value.offsetWidth;
            const maxX = sliderWidth - touchRight.value.offsetWidth;

            const updateLine = () => {
                const left = touchLeft.value!.offsetLeft;
                const right = touchRight.value!.offsetLeft;
                lineSpan.value!.style.marginLeft = `${left}px`;
                lineSpan.value!.style.width = `${right - left}px`;
            };

            const calculateValues = () => {
                const range = max.value - min.value;
                const width = sliderWidth - normalizeFact;
                const leftVal = Math.round((touchLeft.value!.offsetLeft / width) * range + min.value);
                const rightVal = Math.round((touchRight.value!.offsetLeft / width) * range + min.value);

                updateLabels(leftVal, rightVal);
                emitChangeEvent();
            };

            const addDrag = (el: HTMLElement, isLeft: boolean) => {
                let startX = 0;
                let x = 0;

                const onMove = (e: MouseEvent | TouchEvent) => {
                    const clientX = 'touches' in e ? e.touches[0].pageX : e.pageX;
                    x = clientX - startX;
                    x = Math.max(0, Math.min(x, maxX));

                    if (isLeft) {
                        if (x > touchRight.value!.offsetLeft - 10) x = touchRight.value!.offsetLeft - 10;
                        touchLeft.value!.style.left = `${x}px`;
                    } else {
                        if (x < touchLeft.value!.offsetLeft + 10) x = touchLeft.value!.offsetLeft + 10;
                        touchRight.value!.style.left = `${x}px`;
                    }

                    updateLine();
                    calculateValues();
                };

                const onStop = () => {
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onStop);
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', onStop);
                };

                const onStart = (e: MouseEvent | TouchEvent) => {
                    e.preventDefault();
                    const clientX = 'touches' in e ? e.touches[0].pageX : e.pageX;
                    x = el.offsetLeft;
                    startX = clientX - x;

                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onStop);
                    document.addEventListener('touchmove', onMove);
                    document.addEventListener('touchend', onStop);
                };

                el.addEventListener('mousedown', onStart);
                el.addEventListener('touchstart', onStart);
            };

            touchLeft.value.style.left = `0px`;
            touchRight.value.style.left = `${sliderWidth - touchLeft.value.offsetWidth}px`;
            updateLine();
            calculateValues();

            addDrag(touchLeft.value, true);
            addDrag(touchRight.value, false);
        });

        return {
            slider,
            touchLeft,
            touchRight,
            lineSpan,
            currentMin,
            currentMax,
            min,
            max,
            step,
        };
    },
});
</script>

<style scoped lang="scss">
.slider-container {
    width: 100%;
    max-width: 320px;
}

.slider {
    position: relative;
    height: 36px;
    width: 100%;
    user-select: none;
}

.slider-touch {
    position: absolute;
    height: 20px;
    width: 20px;
    padding: 6px;
    z-index: 2;

    span {
        display: block;
        width: 100%;
        height: 100%;
        background: #f0f0f0;
        border: 1px solid #a4a4a4;
        border-radius: 50%;
    }
}

.slider-line {
    position: absolute;
    width: calc(100% - 36px);
    left: 18px;
    top: 16px;
    height: 4px;
    border-radius: 4px;
    background: #f0f0f0;
    z-index: 0;
    overflow: hidden;

    span {
        display: block;
        height: 100%;
        width: 0%;
        background: var(--button-background, var(--c-primary));
    }
}

.range-filter__labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 14px;
    color: var(--c-text);
}
</style>
