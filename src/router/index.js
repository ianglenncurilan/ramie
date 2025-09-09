import { createRouter, createWebHistory } from 'vue-router'
import SplashView from '../views/SplashView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import RecordsView from '../views/RecordsView.vue'
import ExpensesView from '../views/ExpensesView.vue'
import ProfileView from '../views/ProfileView.vue'
import MakeFeedsView from '../views/MakeFeedsView.vue'
import ManageStaffView from '../views/ManageStaffView.vue'
import InventoryView from '../views/InventoryView.vue'
import HogsTrackedView from '../views/HogsTrackedView.vue'
import FeedCalculatorView from '../views/FeedCalculatorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/splash',
    },
    {
      path: '/splash',
      name: 'splash',
      component: SplashView,
    },
    {
      path: '/onboarding',
      name: 'onboarding-1',
      component: OnboardingView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/records',
      name: 'records',
      component: RecordsView,
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: ExpensesView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/make-feeds',
      name: 'make-feeds',
      component: MakeFeedsView,
    },
    {
      path: '/manage-staff',
      name: 'manage-staff',
      component: ManageStaffView,
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView,
    },
    {
      path: '/hogs-tracked',
      name: 'hogs-tracked',
      component: HogsTrackedView,
    },
    {
      path: '/feeds/:stage',
      name: 'feed-calculator',
      component: FeedCalculatorView,
      props: true,
    },
  ],
})

export default router
