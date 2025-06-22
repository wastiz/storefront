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
import { defineComponent, onMounted, ref, PropType, nextTick } from '@nuxtjs/composition-api';
import { SfHeading } from '@storefront-ui/vue';
import type { Aggregation, AggregationOption } from '~/modules/GraphQL/types';

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

        const min = ref(0);
        const max = ref(100);
        const step = 1;
        const isInitialized = ref(false);

        const currentMin = ref(0);
        const currentMax = ref(100);

        // Инициализация диапазона из aggregation.options
        const initializeRange = () => {
            try {
                const options = props.filter?.options || [];

                if (options.length === 0) {
                    console.warn('No filter options available');
                    min.value = 0;
                    max.value = 100;
                    currentMin.value = props.rangeMin ?? 0;
                    currentMax.value = props.rangeMax ?? 100;
                    return;
                }

                // Извлекаем числовые значения из options
                const values = options
                    .map(opt => Number(opt.value))
                    .filter(val => Number.isFinite(val))
                    .sort((a, b) => a - b);

                if (values.length === 0) {
                    console.warn('No valid numeric values in filter options');
                    min.value = 0;
                    max.value = 100;
                    currentMin.value = props.rangeMin ?? 0;
                    currentMax.value = props.rangeMax ?? 100;
                    return;
                }

                min.value = values[0];
                max.value = values[values.length - 1];

                // Убеждаемся что min !== max
                if (min.value === max.value) {
                    max.value = min.value + 1;
                }

                // Устанавливаем текущие значения
                currentMin.value = props.rangeMin ?? min.value;
                currentMax.value = props.rangeMax ?? max.value;

                // Проверяем что текущие значения в допустимых пределах
                currentMin.value = Math.max(min.value, Math.min(currentMin.value, max.value));
                currentMax.value = Math.max(min.value, Math.min(currentMax.value, max.value));

            } catch (error) {
                console.error('Error initializing range:', error);
                min.value = 0;
                max.value = 100;
                currentMin.value = props.rangeMin ?? 0;
                currentMax.value = props.rangeMax ?? 100;
            }
        };

        const updateLabels = (leftVal: number, rightVal: number) => {
            if (!Number.isFinite(leftVal) || !Number.isFinite(rightVal)) {
                return;
            }

            currentMin.value = Math.min(leftVal, rightVal);
            currentMax.value = Math.max(leftVal, rightVal);
        };

        const emitChangeEvent = () => {
            if (!Number.isFinite(currentMin.value) || !Number.isFinite(currentMax.value)) {
                return;
            }

            // Создаем AggregationOption с диапазоном
            const aggregationOption: AggregationOption = {
                value: `${currentMin.value}_${currentMax.value}`,
                label: `${currentMin.value} - ${currentMax.value}`,
                count: null, // Или можно вычислить количество товаров в диапазоне
            };

            emit('selectFilter', aggregationOption);
        };

        const updateLine = () => {
            if (!touchLeft.value || !touchRight.value || !lineSpan.value) return;

            const left = touchLeft.value.offsetLeft;
            const right = touchRight.value.offsetLeft;

            if (!Number.isFinite(left) || !Number.isFinite(right)) return;

            lineSpan.value.style.marginLeft = `${left}px`;
            lineSpan.value.style.width = `${Math.max(0, right - left)}px`;
        };

        const calculateValues = () => {
            if (!slider.value || !touchLeft.value || !touchRight.value) {
                return;
            }

            const range = max.value - min.value;
            const sliderWidth = slider.value.offsetWidth;
            const normalizeFact = 26;
            const effectiveWidth = sliderWidth - normalizeFact;

            if (effectiveWidth <= 0 || range <= 0 || !Number.isFinite(range)) {
                return;
            }

            const leftOffset = touchLeft.value.offsetLeft;
            const rightOffset = touchRight.value.offsetLeft;

            if (!Number.isFinite(leftOffset) || !Number.isFinite(rightOffset)) {
                return;
            }

            const leftVal = Math.round((leftOffset / effectiveWidth) * range + min.value);
            const rightVal = Math.round((rightOffset / effectiveWidth) * range + min.value);

            if (!Number.isFinite(leftVal) || !Number.isFinite(rightVal)) {
                return;
            }

            updateLabels(leftVal, rightVal);
            emitChangeEvent();
        };

        const setSliderPosition = (element: HTMLElement, value: number) => {
            if (!slider.value || !Number.isFinite(value)) return;

            const range = max.value - min.value;
            const sliderWidth = slider.value.offsetWidth;
            const normalizeFact = 26;
            const effectiveWidth = sliderWidth - normalizeFact;

            if (effectiveWidth <= 0 || range <= 0) return;

            const normalizedValue = Math.max(0, Math.min(1, (value - min.value) / range));
            const position = normalizedValue * effectiveWidth;

            element.style.left = `${position}px`;
        };

        const addDrag = (el: HTMLElement, isLeft: boolean) => {
            let startX = 0;
            let isDragging = false;

            const onMove = (e: MouseEvent | TouchEvent) => {
                if (!isDragging) return;

                e.preventDefault();
                const clientX = 'touches' in e ? e.touches[0].pageX : e.pageX;
                let x = clientX - startX;

                if (!slider.value) return;

                const sliderWidth = slider.value.offsetWidth;
                const maxX = sliderWidth - el.offsetWidth;

                x = Math.max(0, Math.min(x, maxX));

                if (isLeft && touchRight.value) {
                    const maxLeftX = touchRight.value.offsetLeft - 10;
                    x = Math.min(x, maxLeftX);
                } else if (!isLeft && touchLeft.value) {
                    const minRightX = touchLeft.value.offsetLeft + 10;
                    x = Math.max(x, minRightX);
                }

                el.style.left = `${x}px`;
                updateLine();
                calculateValues();
            };

            const onStop = () => {
                isDragging = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onStop);
                document.removeEventListener('touchmove', onMove);
                document.removeEventListener('touchend', onStop);
                document.body.style.userSelect = '';
            };

            const onStart = (e: MouseEvent | TouchEvent) => {
                e.preventDefault();
                isDragging = true;

                const clientX = 'touches' in e ? e.touches[0].pageX : e.pageX;
                const rect = el.getBoundingClientRect();
                startX = clientX - rect.left;

                document.addEventListener('mousemove', onMove, { passive: false });
                document.addEventListener('mouseup', onStop);
                document.addEventListener('touchmove', onMove, { passive: false });
                document.addEventListener('touchend', onStop);
                document.body.style.userSelect = 'none';
            };

            el.addEventListener('mousedown', onStart);
            el.addEventListener('touchstart', onStart, { passive: false });
        };

        const initializeSlider = () => {
            if (!slider.value || !touchLeft.value || !touchRight.value || !lineSpan.value) {
                return;
            }

            if (isInitialized.value) return;

            const sliderWidth = slider.value.offsetWidth;

            if (sliderWidth === 0) {
                setTimeout(initializeSlider, 100);
                return;
            }

            // Устанавливаем начальные позиции
            setSliderPosition(touchLeft.value, currentMin.value);
            setSliderPosition(touchRight.value, currentMax.value);

            updateLine();

            addDrag(touchLeft.value, true);
            addDrag(touchRight.value, false);

            isInitialized.value = true;
        };

        onMounted(async () => {
            initializeRange();
            await nextTick();

            setTimeout(() => {
                initializeSlider();
            }, 50);
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
    cursor: pointer;

    span {
        display: block;
        width: 100%;
        height: 100%;
        background: #f0f0f0;
        border: 1px solid #a4a4a4;
        border-radius: 50%;
        transition: background-color 0.2s ease;
    }

    &:hover span {
        background: #e0e0e0;
    }

    &:active span {
        background: #d0d0d0;
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
        transition: width 0.1s ease, margin-left 0.1s ease;
    }
}

.range-filter__labels {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 14px;
    color: var(--c-text);
}

.range-filter {
    .filters__title {
        margin-bottom: 12px;
    }
}
</style>
