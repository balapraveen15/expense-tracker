import './style.css'
 
const STORAGE_KEY = 'expense-tracker-transactions'

let transactions = []

const loadTransactions = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    try {
      transactions = JSON.parse(data)
    } catch {
      transactions = []
    }
  }
}

const saveTransactions = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions))
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

const calculateTotals = () => {
  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const expense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = income - expense
  return { income, expense, balance }
}

const updateSummary = () => {
  const { income, expense, balance } = calculateTotals()
  const balanceEl = document.querySelector('[data-balance]')
  const incomeEl = document.querySelector('[data-income]')
  const expenseEl = document.querySelector('[data-expense]')
  if (balanceEl) balanceEl.textContent = formatCurrency(balance)
  if (incomeEl) incomeEl.textContent = formatCurrency(income)
  if (expenseEl) expenseEl.textContent = formatCurrency(expense)
}

const updateChart = () => {
  const { income, expense } = calculateTotals()
  const incomeBar = document.querySelector('[data-chart-income]')
  const expenseBar = document.querySelector('[data-chart-expense]')
  const max = Math.max(income, expense, 1)
  if (incomeBar) incomeBar.style.height = `${(income / max) * 100}%`
  if (expenseBar) expenseBar.style.height = `${(expense / max) * 100}%`
}

const renderTransactions = (filter = 'all') => {
  const listEl = document.querySelector('[data-transactions-list]')
  if (!listEl) return
  listEl.innerHTML = ''

  const filtered =
    filter === 'all'
      ? transactions
      : transactions.filter((t) => t.type === filter)

  if (filtered.length === 0) {
    listEl.innerHTML = `<div class="empty-state">No transactions yet.</div>`
    return
  }

  const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date))

  sorted.forEach((t) => {
    const item = document.createElement('div')
    const isIncome = t.type === 'income'
    const sign = isIncome ? '+' : '-'
    const colorClass = isIncome ? 'income' : 'expense'
    item.className = `transaction-item ${colorClass}`
    item.innerHTML = `
      <div class="transaction-info">
        <span class="transaction-title">${t.title}</span>
        <span class="transaction-date">${formatDate(t.date)}</span>
      </div>
      <div class="transaction-amount ${colorClass}">${sign}${formatCurrency(t.amount)}</div>
      <button class="delete-btn" data-id="${t.id}" aria-label="Delete transaction">x</button>
    `
    listEl.appendChild(item)
  })
}

const addTransaction = (e) => {
  e.preventDefault()
  const title = document.querySelector('[data-title]').value.trim()
  const amount = parseFloat(document.querySelector('[data-amount]').value)
  const type = document.querySelector('[data-type]').value

  if (!title || isNaN(amount) || amount <= 0) {
    alert('Please enter a valid title and amount.')
    return
  }

  const transaction = {
    id: crypto.randomUUID(),
    title,
    amount,
    type,
    date: new Date().toISOString(),
  }

  transactions.push(transaction)
  saveTransactions()
  updateSummary()
  updateChart()
  const filter = document.querySelector('[data-filter]').value
  renderTransactions(filter)
  e.target.reset()
}

const deleteTransaction = (id) => {
  transactions = transactions.filter((t) => t.id !== id)
  saveTransactions()
  updateSummary()
  updateChart()
  const filter = document.querySelector('[data-filter]').value
  renderTransactions(filter)
}

const setupEventListeners = () => {
  document.querySelector('[data-form]').addEventListener('submit', addTransaction)
  document.querySelector('[data-transactions-list]').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const id = e.target.getAttribute('data-id')
      deleteTransaction(id)
    }
  })
  document.querySelector('[data-filter]').addEventListener('change', (e) => {
    renderTransactions(e.target.value)
  })
}

const initApp = () => {
  loadTransactions()
  updateSummary()
  updateChart()
  renderTransactions()
  setupEventListeners()
}

initApp()
