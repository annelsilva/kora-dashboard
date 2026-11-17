const initialTransactions = [
    { id: 101, description: 'Consultoria UI/UX — Projeto Atlas', amount: 4800.00, type: 'income', category: 'Receita', date: '2026-09-05' },
    { id: 102, description: 'Aluguel e Condomínio', amount: 1650.00, type: 'expense', category: 'Moradia', date: '2026-09-10' },
    { id: 103, description: 'Assinatura Figma & Cloud', amount: 240.00, type: 'expense', category: 'Operacional', date: '2026-09-15' },
    { id: 104, description: 'Desenvolvimento Landing Page', amount: 3200.00, type: 'income', category: 'Receita', date: '2026-10-04' },
    { id: 105, description: 'Aluguel e Condomínio', amount: 1650.00, type: 'expense', category: 'Moradia', date: '2026-10-10' },
    { id: 106, description: 'Supermercado Mensal', amount: 780.40, type: 'expense', category: 'Alimentação', date: '2026-10-14' },
    { id: 107, description: 'Manutenção Equipamento', amount: 420.00, type: 'expense', category: 'Operacional', date: '2026-10-21' },
    { id: 108, description: 'Contrato Retainer Frontend', amount: 5600.00, type: 'income', category: 'Receita', date: '2026-11-03' },
    { id: 109, description: 'Aluguel e Condomínio', amount: 1650.00, type: 'expense', category: 'Moradia', date: '2026-11-08' },
    { id: 110, description: 'Supermercado e Feira', amount: 645.90, type: 'expense', category: 'Alimentação', date: '2026-11-11' },
    { id: 111, description: 'Mobilidade e Combustível', amount: 310.00, type: 'expense', category: 'Transporte', date: '2026-11-14' },
    { id: 112, description: 'Internet Fibra e Energia', amount: 289.50, type: 'expense', category: 'Serviços', date: '2026-11-16' }
  ];
  
  let transactions = JSON.parse(localStorage.getItem('kora_ledger_v1')) || initialTransactions;
  let cashflowChart = null;
  let expenseChart = null;
  
  // Elementos da interface
  const transactionList = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');
  const searchInput = document.getElementById('search-input');
  const filterCategory = document.getElementById('filter-category');
  const filterType = document.getElementById('filter-type');
  const filterMonth = document.getElementById('filter-month');
  const clearFiltersBtn = document.getElementById('clear-filters');
  
  // Modal
  const modal = document.getElementById('transaction-modal');
  const openModalBtn = document.getElementById('open-modal-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const cancelModalBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('transaction-form');
  
  // Paleta sobria para categorias
  const categoryPalette = {
    'Moradia': '#18181b',
    'Operacional': '#3b82f6',
    'Alimentação': '#10b981',
    'Transporte': '#f59e0b',
    'Serviços': '#8b5cf6',
    'Receita': '#059669'
  };
  
  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  
  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  
  function getFilteredData() {
    const query = searchInput.value.trim().toLowerCase();
    const cat = filterCategory.value;
    const type = filterType.value;
    const month = filterMonth.value;
  
    const hasActiveFilter = query !== '' || cat !== 'all' || type !== 'all' || month !== '';
    clearFiltersBtn.classList.toggle('hidden', !hasActiveFilter);
  
    return transactions.filter(item => {
      const matchesSearch = item.description.toLowerCase().includes(query);
      const matchesCat = cat === 'all' || item.category === cat;
      const matchesType = type === 'all' || item.type === type;
      const matchesMonth = month === '' || item.date.startsWith(month);
      return matchesSearch && matchesCat && matchesType && matchesMonth;
    });
  }
  
  function saveAndRender() {
    localStorage.setItem('kora_ledger_v1', JSON.stringify(transactions));
    renderAll();
  }
  
  function renderAll() {
    const filtered = getFilteredData();
    updateKPIs(filtered);
    renderTable(filtered);
    renderCashflowChart();
    renderExpenseChart(filtered);
  }
  
  function updateKPIs(data) {
    const incomes = data.filter(t => t.type === 'income');
    const expenses = data.filter(t => t.type === 'expense');
  
    const totalIncome = incomes.reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;
    const margin = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;
  
    document.getElementById('total-balance').textContent = formatCurrency(balance);
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
  
    document.getElementById('income-count').textContent = `${incomes.length} lançamento(s) no período`;
    document.getElementById('expense-count').textContent = `${expenses.length} lançamento(s) no período`;
    document.getElementById('savings-rate').textContent = `${margin}% margem`;
  }
  
  function renderTable(data) {
    transactionList.innerHTML = '';
    document.getElementById('ledger-count').textContent = data.length;
  
    if (data.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
  
    emptyState.classList.add('hidden');
  
    const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
  
    sorted.forEach(item => {
      const tr = document.createElement('tr');
      const isIncome = item.type === 'income';
      const prefix = isIncome ? '+' : '-';
      const valueClass = isIncome ? 'text-income' : 'text-expense';
  
      tr.innerHTML = `
        <td><strong>${item.description}</strong></td>
        <td><span class="cat-tag">${item.category}</span></td>
        <td class="mono" style="color: var(--text-muted); font-size: 0.82rem;">${formatDate(item.date)}</td>
        <td class="text-right mono ${valueClass}"><strong>${prefix} ${formatCurrency(item.amount)}</strong></td>
        <td class="col-action">
          <button class="btn-delete" data-id="${item.id}" title="Excluir lançamento" aria-label="Excluir">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>
      `;
      transactionList.appendChild(tr);
    });
  }
  
  function renderCashflowChart() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#27272a' : '#f4f4f5';
    const tickColor = isDark ? '#71717a' : '#71717a';
  
    const monthlyMap = {};
    transactions.forEach(t => {
      const monthKey = t.date.slice(0, 7);
      if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { income: 0, expense: 0 };
      monthlyMap[monthKey][t.type] += t.amount;
    });
  
    const sortedMonths = Object.keys(monthlyMap).sort();
    const labels = sortedMonths.map(m => {
      const [year, month] = m.split('-');
      const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${names[parseInt(month, 10) - 1]}/${year.slice(2)}`;
    });
  
    const incomeData = sortedMonths.map(m => monthlyMap[m].income);
    const expenseData = sortedMonths.map(m => monthlyMap[m].expense);
  
    const ctx = document.getElementById('cashflow-chart').getContext('2d');
    if (cashflowChart) cashflowChart.destroy();
  
    cashflowChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas',
            data: incomeData,
            backgroundColor: '#10b981',
            borderRadius: 5,
            barPercentage: 0.55
          },
          {
            label: 'Despesas',
            data: expenseData,
            backgroundColor: isDark ? '#3f3f46' : '#18181b',
            borderRadius: 5,
            barPercentage: 0.55
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: tickColor, boxWidth: 10, usePointStyle: true, pointStyle: 'circle' }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: tickColor, font: { family: 'Inter', size: 11 } }
          },
          y: {
            border: { display: false },
            grid: { color: gridColor },
            ticks: {
              color: tickColor,
              font: { family: 'JetBrains Mono', size: 11 },
              callback: value => 'R$ ' + value
            }
          }
        }
      }
    });
  }
  
  function renderExpenseChart(data) {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const expenses = data.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
  
    const byCategory = {};
    expenses.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
    });
  
    const sortedEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(e => e[0]);
    const values = sortedEntries.map(e => e[1]);
    const colors = labels.map(cat => {
      if (cat === 'Moradia' && isDark) return '#e4e4e7';
      return categoryPalette[cat] || '#71717a';
    });
  
    const breakdownList = document.getElementById('category-breakdown');
    breakdownList.innerHTML = '';
  
    if (sortedEntries.length === 0) {
      breakdownList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.82rem;">Sem despesas neste filtro.</li>';
    } else {
      sortedEntries.forEach(([cat, val], idx) => {
        const pct = totalExpense > 0 ? Math.round((val / totalExpense) * 100) : 0;
        const li = document.createElement('li');
        li.className = 'breakdown-item';
        li.innerHTML = `
          <div class="breakdown-left">
            <span class="dot" style="background-color: ${colors[idx]}"></span>
            <span>${cat}</span>
          </div>
          <div class="breakdown-right mono">
            <span>${formatCurrency(val)}</span>
            <span class="breakdown-pct">${pct}%</span>
          </div>
        `;
        breakdownList.appendChild(li);
      });
    }
  
    const ctx = document.getElementById('expense-chart').getContext('2d');
    if (expenseChart) expenseChart.destroy();
  
    expenseChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values.length ? values : [1],
          backgroundColor: values.length ? colors : [isDark ? '#27272a' : '#e4e4e7'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: { display: false },
          tooltip: { enabled: values.length > 0 }
        }
      }
    });
  }
  
  // Excluir item via delegação de eventos
  transactionList.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-delete');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    transactions = transactions.filter(t => t.id !== id);
    saveAndRender();
  });
  
  // Controle do Modal
  function openModal() {
    document.getElementById('date').valueAsDate = new Date();
    modal.classList.remove('hidden');
    document.getElementById('description').focus();
  }
  
  function closeModal() {
    modal.classList.add('hidden');
    form.reset();
  }
  
  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
  });
  
  // Salvar nova movimentação
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const selectedType = document.querySelector('input[name="type"]:checked').value;
  
    const newEntry = {
      id: Date.now(),
      description: document.getElementById('description').value.trim(),
      amount: parseFloat(document.getElementById('amount').value),
      type: selectedType,
      category: document.getElementById('category').value,
      date: document.getElementById('date').value
    };
  
    transactions.unshift(newEntry);
    closeModal();
    saveAndRender();
  });
  
  // Tema Claro / Escuro
  const themeToggle = document.getElementById('theme-toggle');
  const iconMoon = document.getElementById('icon-moon');
  const iconSun = document.getElementById('icon-sun');
  
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      iconMoon.classList.remove('hidden');
      iconSun.classList.add('hidden');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      iconMoon.classList.add('hidden');
      iconSun.classList.remove('hidden');
    }
    renderAll();
  });
  
  // Exportar CSV
  document.getElementById('export-csv').addEventListener('click', () => {
    const filtered = getFilteredData();
    let csv = '\uFEFFDescrição;Categoria;Data;Tipo;Valor\n';
    filtered.forEach(item => {
      const tipo = item.type === 'income' ? 'Entrada' : 'Saída';
      const valor = item.amount.toFixed(2).replace('.', ',');
      csv += `"${item.description}";"${item.category}";"${formatDate(item.date)}";"${tipo}";"${valor}"\n`;
    });
  
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `kora-extrato-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  });
  
  // Filtros
  [searchInput, filterCategory, filterType, filterMonth].forEach(el => {
    el.addEventListener('input', renderAll);
  });
  
  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterCategory.value = 'all';
    filterType.value = 'all';
    filterMonth.value = '';
    renderAll();
  });
  
  // Inicializar
  renderAll();