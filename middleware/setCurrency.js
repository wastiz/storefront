import Cookies from 'js-cookie'

// Currency is hardcoded as EUR
export default function(context){
    const currentCurrency = context.app.$cookies.get('vsf-currency')
    if (currentCurrency !== 'eur') {
        Cookies.set('vsf-currency', 'eur', { path: '/' })
    }
}