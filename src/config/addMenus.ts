import {
  TrendingDown, TrendingUp, Target, RefreshCw, Upload, Download,
  Calendar, Filter, CircleDollarSign, Pencil, Check, LayoutGrid,
  BarChart2, Mail, Globe, User, Wallet, PiggyBank, type LucideIcon,
} from 'lucide-react'

export type OptionAction = 'navigate' | 'coming_soon' | 'run_rules' | 'pending'
export type OptionColor  = 'accent' | 'positive' | 'negative' | 'info' | 'warning'

export interface MenuOption {
  icon:       LucideIcon
  color:      OptionColor
  label:      string
  desc:       string
  action:     OptionAction
  target?:    string  // navigate to this route (for 'navigate' and 'pending')
  pendingId?: string  // key consumed by the target page (for 'pending')
}

export interface PageMenu {
  title:   string
  sub:     string
  options: MenuOption[]
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const currentMonth = MONTH_NAMES[new Date().getMonth()]

export const MENUS: Record<string, PageMenu> = {

  '/dashboard': {
    title: 'Quick add',
    sub:   'Jump straight to a new entry',
    options: [
      { icon: TrendingDown,     color: 'negative', label: 'Expense',    desc: 'Log money you spent',   action: 'pending', pendingId: 'expense:open-add'  },
      { icon: TrendingUp,       color: 'positive', label: 'Income',     desc: 'Log money you earned',  action: 'pending', pendingId: 'earning:open-add'  },
      { icon: Target,           color: 'accent',   label: 'Set a goal', desc: 'Save toward something', action: 'pending', pendingId: 'goal:open-add'     },
      { icon: CircleDollarSign, color: 'info',     label: 'Budget',     desc: 'Set a spending limit',  action: 'pending', pendingId: 'budget:open-add'   },
    ],
  },

  '/expenses': {
    title: 'Add a transaction',
    sub:   'Record what you spent',
    options: [
      { icon: TrendingDown, color: 'negative', label: 'Expense',           desc: 'A one-off purchase',      action: 'pending',    pendingId: 'expense:open-add'            },
      { icon: RefreshCw,    color: 'info',     label: 'Recurring expense', desc: 'Repeats every month',     action: 'pending',    pendingId: 'expense:open-add-recurring'  },
      { icon: Upload,       color: 'warning',  label: 'Import',            desc: 'From a CSV or bank file', action: 'pending',    pendingId: 'expense:open-import'         },
      { icon: Download,     color: 'accent',   label: 'Generate PDF',      desc: 'Export your expenses',    action: 'pending', pendingId: 'expense:export-pdf'          },
    ],
  },

  '/earnings': {
    title: 'Add income',
    sub:   'Record what you earned',
    options: [
      { icon: TrendingUp, color: 'positive', label: 'Income',           desc: 'A one-off earning',       action: 'pending',    pendingId: 'earning:open-add'            },
      { icon: RefreshCw,  color: 'info',     label: 'Recurring income', desc: 'Salary, retainer…',       action: 'pending',    pendingId: 'earning:open-add-recurring'  },
      { icon: Upload,     color: 'accent',   label: 'Import',           desc: 'From a CSV or bank file', action: 'pending',    pendingId: 'earning:open-import'         },
      { icon: Download,   color: 'warning',  label: 'Generate PDF',     desc: 'Export your earnings',    action: 'pending', pendingId: 'earning:export-pdf'          },
    ],
  },

  '/weeks': {
    title: 'Add to this week',
    sub:   'Slot an entry into a day',
    options: [
      { icon: TrendingDown, color: 'negative', label: 'Expense',          desc: 'On a chosen day',     action: 'pending',    pendingId: 'expense:open-add', target: '/expenses' },
      { icon: TrendingUp,   color: 'positive', label: 'Income',           desc: 'On a chosen day',     action: 'pending',    pendingId: 'earning:open-add', target: '/earnings' },
      { icon: Calendar,     color: 'info',     label: 'Move to a day',    desc: 'Reschedule an entry', action: 'pending',    pendingId: 'week:open-move'                          },
      { icon: Filter,       color: 'accent',   label: 'Split across days',desc: 'Spread one cost out', action: 'coming_soon'                                                    },
    ],
  },

  '/budgets': {
    title: 'Manage budgets',
    sub:   'Set or adjust your limits',
    options: [
      { icon: CircleDollarSign, color: 'accent',   label: 'New budget',      desc: 'For a category',              action: 'pending',    pendingId: 'budget:open-add' },
      { icon: Pencil,           color: 'info',     label: 'Adjust a limit',  desc: 'Raise or lower it',           action: 'pending',    pendingId: 'budget:open-adjust' },
      { icon: Check,            color: 'warning',  label: 'Clear alerts',    desc: 'Dismiss over-budget warnings', action: 'pending',    pendingId: 'budget:clear-alerts' },
      { icon: LayoutGrid,       color: 'positive', label: 'From a template', desc: '50/30/20, zero-based…',       action: 'coming_soon'                              },
    ],
  },

  '/goals': {
    title: 'New goal',
    sub:   'Decide what you\'re working toward',
    options: [
      { icon: Target, color: 'accent',  label: 'Savings goal',    desc: 'Reach an amount',           action: 'pending',    pendingId: 'goal:open-add'        },
      { icon: Wallet, color: 'info',    label: 'Contribute',      desc: 'Add money to a goal',       action: 'pending',    pendingId: 'goal:open-contribute'  },
      { icon: Check,  color: 'warning', label: 'Fully fund goal', desc: 'Cover the full target now', action: 'pending',    pendingId: 'goal:open-fully-fund'    },
    ],
  },

  '/funds': {
    title: 'Sinking funds',
    sub:   'Save up for the big irregular bills',
    options: [
      { icon: PiggyBank, color: 'accent',   label: 'New fund',      desc: 'Save toward a future cost', action: 'pending', pendingId: 'fund:open-add'       },
      { icon: Wallet,    color: 'info',     label: 'Set aside',     desc: "Add this period's amount",  action: 'pending', pendingId: 'fund:open-set-aside' },
      { icon: Check,     color: 'positive', label: 'Record payout', desc: 'Pay a bill from a fund',    action: 'pending', pendingId: 'fund:open-payout'    },
    ],
  },

  '/analytics': {
    title: 'Add a view',
    sub:   'Build or export a report',
    options: [
      { icon: BarChart2, color: 'accent',   label: 'Custom report',   desc: 'Pick metrics & range', action: 'coming_soon' },
      { icon: Calendar,  color: 'info',     label: 'Compare periods', desc: 'Month vs month',       action: 'coming_soon' },
      { icon: Download,  color: 'positive', label: 'Export PDF',      desc: 'Download the data',    action: 'pending', pendingId: 'analytics:export-pdf' },
      { icon: Mail,      color: 'warning',  label: 'Schedule email',  desc: 'Recurring summary',    action: 'coming_soon' },
    ],
  },

  '/projected': {
    title: 'Add to your plan',
    sub:   `Choose what you want to add for ${currentMonth}`,
    options: [
      { icon: Pencil,    color: 'accent',   label: 'Planned cost',    desc: 'A one-off cost this month',  action: 'pending',    pendingId: 'projected:open-add' },
      { icon: TrendingUp,color: 'positive', label: 'Expected income', desc: 'Money you plan to bring in', action: 'coming_soon'                                   },
      { icon: RefreshCw, color: 'info',     label: 'Recurring bill',  desc: 'Repeats automatically',      action: 'navigate',   target: '/recurring'             },
      { icon: Download,  color: 'warning',  label: 'Generate PDF',    desc: 'Export your plan',           action: 'pending', pendingId: 'projected:export-pdf'    },
    ],
  },

  '/recurring': {
    title: 'New recurring rule',
    sub:   'Automate a repeating entry',
    options: [
      { icon: TrendingDown, color: 'accent',   label: 'Recurring expense', desc: 'Rent, subscriptions…', action: 'pending',  pendingId: 'recurring:open-add-expense' },
      { icon: TrendingUp,   color: 'positive', label: 'Recurring income',  desc: 'Salary, retainer…',    action: 'pending',  pendingId: 'recurring:open-add-income'  },
      { icon: Check,        color: 'info',     label: 'Run due rules',     desc: 'Post what\'s due now', action: 'run_rules'                                          },
      { icon: Download,     color: 'warning',  label: 'Generate PDF',      desc: 'Export your rules',    action: 'pending', pendingId: 'recurring:export-pdf'        },
    ],
  },

  '/categories': {
    title: 'New category',
    sub:   'Organize your money',
    options: [
      { icon: TrendingDown, color: 'negative', label: 'Expense category', desc: 'For spending',    action: 'pending',    pendingId: 'category:open-add-expense' },
      { icon: TrendingUp,   color: 'positive', label: 'Income category',  desc: 'For earnings',   action: 'pending',    pendingId: 'category:open-add-income'  },
      { icon: LayoutGrid,   color: 'info',     label: 'New group',        desc: 'Bundle categories',action: 'coming_soon'                                       },
      { icon: Filter,       color: 'accent',   label: 'Reorder',          desc: 'Drag to sort',   action: 'coming_soon'                                         },
    ],
  },

  '/settings': {
    title: 'Add',
    sub:   'Extend your workspace',
    options: [
      { icon: Globe, color: 'accent',   label: 'Currency',      desc: 'Track another currency', action: 'navigate', target: '/settings' },
      { icon: User,  color: 'info',     label: 'Account',       desc: 'Cash, card, savings…',  action: 'coming_soon'                   },
      { icon: Mail,  color: 'positive', label: 'Invite member', desc: 'Share this workspace',  action: 'coming_soon'                   },
    ],
  },
}