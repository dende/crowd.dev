import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'
import { store } from '@/store'
import config from '@/config'
import {
  isFeatureEnabled,
  featureFlags
} from '@/utils/posthog'

const isEagleEyeFeatureEnabled = () => {
  return (
    config.hasPremiumModules &&
    isFeatureEnabled(featureFlags.eagleEye)
  )
}

const EagleEyePage = () =>
  import('@/premium/eagle-eye/pages/eagle-eye-page.vue')

const EagleEyePaywall = () =>
  import('@/modules/layout/components/paywall-page.vue')

export default [
  {
    path: '',
    component: Layout,
    meta: {
      auth: true
    },
    children: [
      {
        name: 'eagleEye',
        path: '/eagle-eye',
        component: EagleEyePage,
        exact: true,
        meta: {
          auth: true,
          permission: Permissions.values.eagleEyeRead
        },
        beforeEnter: (to, _from, next) => {
          if (!isEagleEyeFeatureEnabled()) {
            next({ name: 'eagleEyePaywall' })
          }

          if (
            to.query.activeTab !== undefined &&
            store.getters['eagleEye/activeView'].id !==
              to.query.activeTab
          ) {
            store.dispatch(
              'eagleEye/doChangeActiveView',
              to.query.activeTab
            )
          }

          next()
        }
      },
      {
        name: 'eagleEyePaywall',
        path: '/eagle-eye/403',
        component: EagleEyePaywall
      }
    ]
  }
]
