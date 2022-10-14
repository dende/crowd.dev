import Layout from '@/modules/layout/components/layout.vue'
import Permissions from '@/security/permissions'

const MemberListPage = () =>
  import('@/modules/member/pages/member-list-page.vue')
const MemberMergePage = () =>
  import('@/modules/member/pages/member-merge-page.vue')
const MemberMergeSuggestionsPage = () =>
  import(
    '@/modules/member/pages/member-merge-suggestions-page.vue'
  )
const MemberViewPage = () =>
  import('@/modules/member/pages/member-view-page.vue')
const MemberCreatePage = () =>
  import('@/modules/member/pages/member-form-page.vue')

export default [
  {
    name: '',
    path: '',
    component: Layout,
    meta: { auth: true },
    children: [
      {
        name: 'member',
        path: '/members',
        component: MemberListPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead
        }
      },
      {
        name: 'memberCreate',
        path: '/members/new',
        component: MemberCreatePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberCreate
        }
      },
      {
        name: 'memberEdit',
        path: '/members/:id/edit',
        component: MemberCreatePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit
        },
        props: true
      },
      {
        name: 'memberMergeSuggestions',
        path: '/members/merge-suggestions',
        component: MemberMergeSuggestionsPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit
        }
      },
      {
        name: 'memberView',
        path: '/members/:id',
        component: MemberViewPage,
        meta: {
          auth: true,
          permission: Permissions.values.memberRead
        },
        props: true
      },
      {
        name: 'memberMerge',
        path: '/members/:id/merge',
        component: MemberMergePage,
        meta: {
          auth: true,
          permission: Permissions.values.memberEdit
        },
        props: true
      }
    ]
  }
]
