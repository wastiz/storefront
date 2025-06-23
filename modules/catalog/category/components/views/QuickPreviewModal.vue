<template>
    <div v-if="isVisible" class="quick-preview-modal">
        <div class="modal-overlay" @click.self="close"></div>
        <div class="modal-container">
            <button class="modal-close" @click="close">
                <SfIcon icon="cross" size="20px" />
            </button>

            <div v-if="loading" class="loading-state">
                <SfLoader />
                <p>Loading product details...</p>
            </div>

            <div v-else-if="product" class="modal-content">
                <div class="modal-main">
                    <div class="product-gallery">
                        <SfImage
                            :src="getMagentoImage(getProductThumbnailImage(product))"
                            :alt="getName(product)"
                            class="product-image"
                            :image-tag="imageTag"
                            :nuxt-img-config="nuxtImgConfig"
                            width="300"
                            height="300"
                        />
                    </div>

                    <div class="product-details">
                        <div class="product-header">
                            <h2 class="product-title">{{ getName(product) }}</h2>
                            <div v-if="product.manufacturer" class="product-brand">
                                {{ product.manufacturer }}
                            </div>
                            <div v-if="product.model" class="product-model">
                                Model: {{ product.model }}
                            </div>

                            <div class="product-rating">
                                <SfRating :score="product.rating_summary" max="5" />
                                <span v-if="product.review_count" class="reviews-count">
                  ({{ product.review_count }} reviews)
                </span>
                            </div>

                            <div class="product-description" v-if="getDescription(product)">
                                <h3>Description</h3>
                                <p v-html="getDescription(product)"></p>
                            </div>
                        </div>

                        <div class="product-availability">
                            <SfIcon
                                :icon="product.stock_status === 'IN_STOCK' ? 'check' : 'cross'"
                                size="14px"
                                :color="product.stock_status === 'IN_STOCK' ? 'green' : 'red'"
                            />
                            {{ product.stock_status === 'IN_STOCK' ? 'In Stock' : 'Out of Stock' }}
                        </div>

                        <div class="product-price">
                            <SfPrice
                                :regular="$fc(getPrice(product).regular)"
                                :special="$fc(getPrice(product).final)"
                            />
                        </div>

                        <div class="product-actions">
                            <div class="quantity-selector">
                                <SfQuantitySelector v-model="quantity" :min="1" :max="10" />
                            </div>
                            <SfButton
                                class="add-to-cart"
                                :disabled="product.stock_status !== 'IN_STOCK' || isInCart(product)"
                                @click="addToCart"
                            >
                                {{ isInCart(product) ? 'Added to Cart' : 'Add to Cart' }}
                            </SfButton>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="error" class="error-state">
                <SfAlert type="error" message="Failed to load product details" />
                <SfButton class="retry-button" @click="fetchProduct">Try Again</SfButton>
            </div>
        </div>
    </div>
</template>

<script>
import { computed, ref, useContext } from '@nuxtjs/composition-api';
import { SfImage, SfPrice, SfRating, SfButton, SfQuantitySelector, SfIcon, SfLoader, SfAlert } from '@storefront-ui/vue';
import { useImage } from '~/composables';
import { useAddToCart } from '~/helpers/cart/addToCart';
import { useProduct } from '~/modules/catalog/product/composables/useProduct';
import { getName, getPrice, getProductThumbnailImage, getDecription, getDescription } from '~/modules/catalog/product/getters/productGetters';
import { getAverageRating, getTotalReviews } from '~/modules/review/getters/reviewGetters';

export default {
    name: 'QuickPreviewModal',
    methods: {getDescription},
    components: {
        SfImage,
        SfPrice,
        SfRating,
        SfButton,
        SfQuantitySelector,
        SfIcon,
        SfLoader,
        SfAlert
    },
    props: {
        product: {
            type: Object,
            required: true
        },
        isVisible: {
            type: Boolean,
            default: false
        }
    },
    setup(props, { emit }) {
        const { getMagentoImage } = useImage();
        const { isInCart } = useAddToCart();
        const quantity = ref(1);

        const close = () => emit('close');

        const addToCart = () => {
            emit('add-to-cart', {
                product: props.product,
                quantity: quantity.value
            });
            close();
        };

        return {
            quantity,
            getMagentoImage,
            getName,
            getPrice,
            getProductThumbnailImage,
            getAverageRating,
            getTotalReviews,
            isInCart,
            close,
            addToCart
        };
    }
};
</script>

<style lang="scss" scoped>
.quick-preview-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal-container {
    position: relative;
    width: 90%;
    max-width: 900px;
    max-height: 90vh;
    background: white;
    border-radius: 8px;
    overflow-y: auto;
    z-index: 1;
    padding: 2rem;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    z-index: 10;
}

.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 300px;
    gap: 1rem;
}

.modal-main {
    display: flex;
    flex-direction: row;
    gap: 2rem;
    flex-wrap: wrap;
}

.product-gallery {
    flex: 0 0 300px;
    max-width: 300px;
}

.product-image {
    width: 100%;
    height: auto;
    border-radius: 8px;
    object-fit: contain;
}

.product-details {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.product-header {
    margin-bottom: 1rem;
}

.product-title {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
}

.product-brand,
.product-model {
    font-size: 1rem;
    color: #666;
    margin-bottom: 0.25rem;
}

.product-rating {
    display: flex;
    align-items: center;
    margin: 0.5rem 0 1rem 0;
}

.reviews-count {
    margin-left: 0.5rem;
    font-size: 0.875rem;
    color: #999;
}

.product-description h3 {
    margin-bottom: 0.5rem;
    font-weight: 600;
}

.product-description p {
    margin: 0;
    font-size: 1rem;
    color: #333;
}

.product-availability {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
    font-weight: 600;
}

.product-price {
    margin-bottom: 1rem;
    font-size: 1.5rem;
}

.product-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.quantity-selector {
    flex: 0 0 auto;
    width: 100px;
}
</style>
