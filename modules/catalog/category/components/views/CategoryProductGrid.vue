<template>
    <div>
        <transition-group
            appear
            class="grid-layout"
            name="slide"
            tag="div"
        >
            <template v-if="loading">
                <div
                    v-for="n in 4*3"
                    :key="n"
                    class="sf-product-card card"
                    data-testid="skeleton"
                >
                    <SkeletonLoader :height="`${imageSize.height}px`" />
                    <SkeletonLoader />
                    <SkeletonLoader />
                </div>
            </template>
            <template v-else>
                <SfProductCard
                    v-for="product in productsWithCommonProductCardProps"
                    :key="product.uid"
                    v-bind="product.commonProps"
                    class="card"
                    data-testid="product-card"
                    :image-height="imageSize.height"
                    :image-width="imageSize.width"
                    :show-add-to-cart-button="true"
                    @click:wishlist="$emit('click:wishlist', product)"
                    @click:add-to-cart="$emit('click:add-to-cart', { product, quantity: 1 })"
                    @click:quick-preview="openQuickPreview(product)"
                >
                    <template #price>
                        <CategoryProductPrice :product="product" />
                    </template>
                </SfProductCard>
            </template>
        </transition-group>

        <QuickPreviewModal
            v-if="showQuickPreview"
            :product="selectedProduct"
            :is-visible="showQuickPreview"
            @close="closeQuickPreview"
            @add-to-cart="handleAddToCart"
        />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, toRefs } from '@nuxtjs/composition-api';
import { SfProductCard } from '@storefront-ui/vue';
import { useImage } from '~/composables';
import type { Product } from '~/modules/catalog/product/types';

import SkeletonLoader from '~/components/SkeletonLoader/index.vue';
import CategoryProductPrice from '~/modules/catalog/category/components/views/CategoryProductPrice.vue';
import { useProductsWithCommonProductCardProps } from './useProductsWithCommonCardProps';
import QuickPreviewModal from '~/modules/catalog/category/components/views/QuickPreviewModal.vue';

export default defineComponent({
    name: 'ProductGrid',
    components: {
        QuickPreviewModal,
        CategoryProductPrice,
        SfProductCard,
        SkeletonLoader,
    },
    props: {
        products: {
            type: Array as PropType<Product[]>,
            required: true,
        },
        pricesLoaded: {
            type: Boolean,
            default: false,
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['click:wishlist', 'click:add-to-cart'],
    setup(props, { emit }) {
        const { imageSizes: { productCard: imageSize } } = useImage();
        const { products } = toRefs(props);
        const { productsWithCommonProductCardProps } = useProductsWithCommonProductCardProps(products);

        console.log(products);

        const showQuickPreview = ref(false);
        const selectedProduct = ref(null);

        const openQuickPreview = (product) => {
            selectedProduct.value = product;
            showQuickPreview.value = true;
        };

        const closeQuickPreview = () => {
            showQuickPreview.value = false;
        };


        const handleAddToCart = ({ product, quantity }: { product: Product; quantity: number }) => {
            emit('click:add-to-cart', { product, quantity });
            closeQuickPreview();
        };

        return {
            imageSize,
            productsWithCommonProductCardProps,
            showQuickPreview,
            selectedProduct,
            openQuickPreview,
            closeQuickPreview,
            handleAddToCart,
        };
    },
});
</script>

<style lang="scss" scoped>
@import "./transition.scss";

.grid-layout {
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    justify-content: center;

    @include for-desktop {
        justify-content: flex-start;
        margin: var(--spacer-sm) 0 0 var(--spacer-sm);
    }
}

.card {
    --product-card-title-font-weight: var(--font-weight--medium);
    --product-card-title-margin: var(--spacer-xs) 0 0 0;
    flex: 1 1 100%;

    @include for-desktop {
        --product-card-max-width: 25%;
        --product-card-title-font-weight: var(--font-weight--normal);
        --product-card-title-margin: var(--spacer-sm) 0 0 0;
        --product-card-add-button-bottom: var(--spacer-base);
    }
}

::v-deep .sf-product-card {
    .card {
        will-change: transform, opacity;
    }

    &__image-wrapper {
        height: 257px;
    }

    &__add-button {
        @include for-mobile {
            opacity: 1;
            display: flex;
            bottom: 1rem;
            right: 0;
        }
    }
}

::v-deep .sf-product-card::after {
    content: none;
}
</style>
