<template>
  <SfBreadcrumbs
    :breadcrumbs="breadcrumbs"
    class="breadcrumbs"
    data-testid="breadcrumbs"
  />
</template>

<script lang="ts">
import {
  defineComponent, useContext, useFetch, ref,
} from '@nuxtjs/composition-api';
import { SfBreadcrumbs } from '@storefront-ui/vue';
import { useUiHelpers } from '~/composables';
import { useTraverseCategory } from '~/modules/catalog/category/helpers/useTraverseCategory';
import { Breadcrumb } from '~/modules/catalog/types';

export default defineComponent({
  components: { SfBreadcrumbs },
  setup() {
    const { getCatLink } = useUiHelpers();
    const { localePath } = useContext();

    const {
      categoryAncestors, isCategoryTreeLoaded, loadCategoryTree,
    } = useTraverseCategory();
    const breadcrumbs = ref<Breadcrumb[]>([]);

      useFetch(async () => {
          if (!isCategoryTreeLoaded.value) {
              await loadCategoryTree();
          }

          const ancestors = categoryAncestors.value;
          const homeBreadcrumb = { text: 'Home', link: localePath('/') };
          const lastCategory = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;

          breadcrumbs.value = [
              homeBreadcrumb,
              ...ancestors.slice(0, -1).map(category => ({
                  text: category.name,
                  link: localePath(getCatLink(category)),
              })),
          ];

          if (lastCategory) {
              breadcrumbs.value.push({
                  text: lastCategory.name,
                  link: localePath(getCatLink(lastCategory)),
              });
          }
      });

    return {
      breadcrumbs,
    };
  },
});
</script>
<style lang="scss" scoped>
.breadcrumbs {
  margin-left: var(--spacer-sm);

  @include for-mobile {
    margin-top: var(--spacer-lg)
  }
}
</style>
