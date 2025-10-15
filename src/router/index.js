import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated, isAdmin } from '../services/supabase'
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
import StarterFeedCalculatorView from '../views/StarterFeedCalculatorView.vue'
import GrowerFeedCalculatorView from '../views/GrowerFeedCalculatorView.vue'
import FinisherFeedCalculatorView from '../views/FinisherFeedCalculatorView.vue'
import AdminView from '../views/AdminView.vue'
import ForbiddenView from '../views/ForbiddenView.vue'

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
      meta: { requiresAdmin: true },
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
      meta: { requiresAdmin: true },
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
      path: '/feeds/starter',
      name: 'starter-feed-calculator',
      component: StarterFeedCalculatorView,
    },
    {
      path: '/feeds/grower',
      name: 'grower-feed-calculator',
      component: GrowerFeedCalculatorView,
    },
    {
      path: '/feeds/finisher',
      name: 'finisher-feed-calculator',
      component: FinisherFeedCalculatorView,
    },
    {
      path: '/feeds/:stage',
      name: 'feed-calculator',
      component: FeedCalculatorView,
      props: true,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { requiresAdmin: true },
    },
    {
      path: '/forbidden',
      name: 'forbidden',
      component: ForbiddenView,
    },
  ],
})

// Global admin guard
router.beforeEach(async (to, from, next) => {
  try {
    if (to.meta?.requiresAdmin) {
      const authed = await isAuthenticated()
      if (!authed) {
        console.log('User not authenticated, redirecting to login')
        return next({ name: 'login' })
      }
      const admin = await isAdmin()
      if (!admin) {
        console.log('User not admin, redirecting to forbidden')
        return next({ name: 'forbidden' })
      }
    }
    next()
  } catch (error) {
    console.error('Router guard error:', error)
    // If there's an error, allow navigation but log it
    next()
  }
})

export default router
