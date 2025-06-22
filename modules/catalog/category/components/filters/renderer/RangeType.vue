<template>
    <div class="range-filter">
        <SfHeading
            :level="4"
            :title="filter.label"
            class="filters__title sf-heading--left"
        />

        <div class="slider-container">
            <div
                ref="slider"
                class="slider"
                :style="{ '--min': min, '--max': max }"
            >
                <div
                    ref="track"
                    class="slider-track"
                ></div>
                <div
                    ref="range"
                    class="slider-range"
                ></div>
                <div
                    ref="thumbLeft"
                    class="slider-thumb slider-thumb-left"
                    @mousedown="startDrag('left', $event)"
                    @touchstart="startDrag('left', $event)"
                ></div>
                <div
                    ref="thumbRight"
                    class="slider-thumb slider-thumb-right"
                    @mousedown="startDrag('right', $event)"
                    @touchstart="startDrag('right', $event)"
                ></div>
            </div>
        </div>

        <div class="range-values">
            <span>{{ formatValue(currentMin) }}</span>
            <span>{{ formatValue(currentMax) }}</span>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from '@nuxtjs/composition-api';
import { SfHeading } from '@storefront-ui/vue';
import type { Aggregation, AggregationOption } from '~/modules/GraphQL/types';

export default defineComponent({
    name: 'RangeType',
    components: { SfHeading },
    props: {
        filter: {
            type: Object as () => Aggregation,
            required: true
        },
        rangeMin: {
            type: Number,
            default: 0
        },
        rangeMax: {
            type: Number,
            default: 100
        }
    },
    setup(props, { emit }) {
        const slider = ref<HTMLElement | null>(null);
        const track = ref<HTMLElement | null>(null);
        const range = ref<HTMLElement | null>(null);
        const thumbLeft = ref<HTMLElement | null>(null);
        const thumbRight = ref<HTMLElement | null>(null);

        const min = ref(0);
        const max = ref(100);
        const currentMin = ref(0);
        const currentMax = ref(100);
        const activeThumb = ref<'left' | 'right' | null>(null);
        const sliderRect = ref<DOMRect | null>(null);

        const initializeValues = () => {
            const options = props.filter.options || [];
            const values = options
                .map(opt => {
                    const num = Number(opt.value);
                    return isNaN(num) ? null : Math.round(num);
                })
                .filter(v => v !== null) as number[];

            if (values.length > 0) {
                min.value = Math.min(...values);
                max.value = Math.max(...values);
            } else {
                min.value = Math.round(props.rangeMin || 0);
                max.value = Math.round(props.rangeMax || 100);
            }

            if (min.value >= max.value) {
                max.value = min.value + 1;
            }

            currentMin.value = min.value;
            currentMax.value = max.value;
        };

        const formatValue = (value: number) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(value);
        };

        const getPercentage = (value: number) => {
            return ((value - min.value) / (max.value - min.value)) * 100;
        };

        const updatePositions = () => {
            if (!slider.value || !range.value || !thumbLeft.value || !thumbRight.value) return;

            const leftPercent = getPercentage(currentMin.value);
            const rightPercent = getPercentage(currentMax.value);

            thumbLeft.value.style.left = `${leftPercent}%`;
            thumbRight.value.style.right = `${100 - rightPercent}%`;
            range.value.style.left = `${leftPercent}%`;
            range.value.style.right = `${100 - rightPercent}%`;
        };

        const startDrag = (thumb: 'left' | 'right', e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            activeThumb.value = thumb;
            sliderRect.value = slider.value?.getBoundingClientRect() || null;

            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchmove', handleDrag);
            document.addEventListener('touchend', stopDrag);
        };

        const handleDrag = (e: MouseEvent | TouchEvent) => {
            if (!activeThumb.value || !sliderRect.value) return;

            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            let percentage = (clientX - sliderRect.value.left) / sliderRect.value.width;
            percentage = Math.max(0, Math.min(1, percentage));

            const newValue = Math.round(min.value + percentage * (max.value - min.value));

            if (activeThumb.value === 'left') {
                currentMin.value = Math.min(newValue, currentMax.value - 1);
            } else {
                currentMax.value = Math.max(newValue, currentMin.value + 1);
            }

            updatePositions();
            emitChange();
        };

        const stopDrag = () => {
            activeThumb.value = null;
            sliderRect.value = null;

            document.removeEventListener('mousemove', handleDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchmove', handleDrag);
            document.removeEventListener('touchend', stopDrag);
        };

        const emitChange = () => {
            const option: AggregationOption = {
                value: `${Math.round(currentMin.value)}_${Math.round(currentMax.value)}`,
                label: `${formatValue(currentMin.value)} - ${formatValue(currentMax.value)}`,
                count: null
            };
            emit('selectFilter', option);
        };

        onMounted(() => {
            initializeValues();
            updatePositions();
        });

        watch([min, max], () => {
            currentMin.value = min.value;
            currentMax.value = max.value;
            updatePositions();
        });

        return {
            slider,
            track,
            range,
            thumbLeft,
            thumbRight,
            min,
            max,
            currentMin,
            currentMax,
            startDrag,
            formatValue
        };
    }
});
</script>

<style scoped lang="scss">
.range-filter {
    padding: 0 0.5rem;
    margin-bottom: 1.5rem;
}

.slider-container {
    position: relative;
    height: 40px;
    display: flex;
    align-items: center;
}

.slider {
    position: relative;
    width: 100%;
    height: 4px;
    background: var(--c-light);
    border-radius: 2px;
}

.slider-track {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    border-radius: 2px;
    background-color: var(--c-light);
}

.slider-range {
    position: absolute;
    height: 100%;
    background-color: var(--c-primary);
    border-radius: 2px;
}

.slider-thumb {
    position: absolute;
    width: 20px;
    height: 20px;
    background-color: white;
    border: 2px solid var(--c-primary);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    top: 50%;
    cursor: pointer;
    z-index: 2;
    touch-action: none;
    user-select: none;

    &:hover {
        transform: translate(-50%, -50%) scale(1.1);
    }

    &:active {
        transform: translate(-50%, -50%) scale(1.2);
    }
}

.slider-thumb-left {
    left: 0;
}

.slider-thumb-right {
    right: 0;
    transform: translate(50%, -50%);

    &:hover {
        transform: translate(50%, -50%) scale(1.1);
    }

    &:active {
        transform: translate(50%, -50%) scale(1.2);
    }
}

.range-values {
    display: flex;
    justify-content: space-between;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    color: var(--c-text);
}

.filters__title {
    margin-bottom: 1rem;
}
</style>
