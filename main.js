import './style.css'

const STORAGE_KEY = 'expense-tracker-transactions'

let transactions = []

const loadTransactions = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (data) {
    transactions = JSON.parse(data)
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
  const filter = document.querySelector('[data-filter]').value
  renderTransactions(filter)
  e.target.reset()
}

const deleteTransaction = (id) => {
  transactions = transactions.filter((t) => t.id !== id)
  saveTransactions()
  updateSummary()
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
  document.querySelector('#app').innerHTML = `
    <div class="app">
      <header>
        <h1>Expense Tracker</h1>
      </header>
      <section class="summary">
        <div class="card balance">
          <span class="label">Total Balance</span>
          <span class="value" data-balance>$0.00</span>
        </div>
        <div class="card income">
          <span class="label">Total Income</span>
          <span class="value" data-income>$0.00</span>
        </div>
        <div class="card expense">
          <span class="label">Total Expenses</span>
          <span class="value" data-expense>$0.00</span>
        </div>
      </section>
      <section class="form-section">
        <h2>Add Transaction</h2>
        <form data-form class="transaction-form">
          <input type="text" data-title placeholder="Title" required />
          <input type="number" data-amount placeholder="Amount" min="0.01" step="0.01" required />
          <select data-type>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <button type="submit">Add Transaction</button>
        </form>
      </section>
      <section class="transactions-section">
        <div class="transactions-header">
          <h2>Transactions</h2>
          <select data-filter class="filter-select">
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div class="transactions-list" data-transactions-list>
          <div class="empty-state">No transactions yet.</div>
        </div>
      </section>
    </div>
  `
  updateSummary()
  renderTransactions()
  setupEventListeners()
}

initApp()
