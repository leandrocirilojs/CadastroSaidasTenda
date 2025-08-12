document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expenses');
    const totalAmount = document.getElementById('total-amount');
    const totalProfit = document.getElementById('total-profit');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const filterDriver = document.getElementById('filter-driver');
    const filterStore = document.getElementById('filter-store');
    const downloadPdfButton = document.getElementById('download-pdf');

    let filteredExpenses = [];

    // 🔹 Preenche automaticamente o valor quando seleciona o motorista
    document.getElementById('driver-name').addEventListener('change', function () {
        const driver = this.value;
        const amountInput = document.getElementById('expense-amount');

        let amount = "";
        let lock = false;

        if (driver === "Weverton" || driver === "Alexandre") {
            amount = 160;
            lock = true;
        } else if (driver === "Flavio") {
            amount = 150;
            lock = true;
        } else if (driver === "Marcos" || driver === "Alex" || driver === "Leandro") {
            amount = 0;
            lock = true;
        } else {
            lock = false;
        }

        amountInput.value = amount;
        amountInput.readOnly = lock;
    });

    // Função para carregar e filtrar saídas
    const loadExpenses = (filterStartDateValue = null, filterEndDateValue = null, filterDriverValue = null, filterStoreValue = null) => {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenseList.innerHTML = '';
        let total = 0;
        let totalProf = 0;
        filteredExpenses = [];

        expenses.forEach((expense, index) => {
            const dateExpense = new Date(expense.date);
            const startDateMatch = !filterStartDateValue || dateExpense >= new Date(filterStartDateValue);
            const endDateMatch = !filterEndDateValue || dateExpense <= new Date(filterEndDateValue);
            const driverMatch = !filterDriverValue || expense.driver === filterDriverValue;
            const storeMatch = !filterStoreValue || expense.store === filterStoreValue;

            if (startDateMatch && endDateMatch && driverMatch && storeMatch) {
                const li = document.createElement('li');
                li.innerHTML = `
    <div style="width: 300px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 20px; position: relative; font-family: Arial, sans-serif;">
        <button onclick="removeExpense(${index})" style="position: absolute; top: 15px; right: 15px; color: red; font-weight: bold; border: none; background: none; font-size: 20px; cursor: pointer;">&times;</button>
        <div>
            <h2 style="margin: 0; text-align: left; font-size: 1.5em; color: #333;">${expense.driver}</h2>
            <p style="margin: 5px 0; color: #666;">${expense.store}</p>
        </div>
        
        <table style="width: 100%; margin-top: 20px;">
            <tr>
                <td style="padding: 8px; vertical-align: top;">
                    <p style="font-size: 0.9em; color: #666;">Valor Pago</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: #333;">R$${expense.amount}</p>
                </td>
                <td style="padding: 8px; vertical-align: top;">
                    <p style="font-size: 0.9em; color: #666;">Recebido</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: #333;">R$${expense.received}</p>
                </td>
                 <td style="padding: 8px; vertical-align: top;">
                    <p style="font-size: 0.9em; color: #666;">Peso:</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: #333;">${expense.weight}</p>
                </td>
            </tr>
            <tr>
                <td style="padding: 8px; vertical-align: top;">
                    <p style="font-size: 0.9em; color: #666;">Qtd NFs:</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: #333;">${expense.nfs}</p>
                </td>
                <td style="padding: 8px; vertical-align: top;">
                    <p style="font-size: 0.9em; color: #666;">Lucro</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: green;">R$${expense.profit}</p>
                </td>
                <td style="padding: 8px; vertical-align: top;">
                    <p style="font-size: 0.9em; color: #666;">Data</p>
                    <p style="font-size: 1.2em; font-weight: bold; color: #333;">${expense.date}</p>
                </td>
            </tr>
        </table>
    </div>`;
                expenseList.appendChild(li);
                total += parseFloat(expense.amount);
                totalProf += parseFloat(expense.profit);
                filteredExpenses.push(expense);
            }
        });

        totalAmount.textContent = total.toFixed(2);
        totalProfit.textContent = totalProf.toFixed(2);
    };

    // Adicionar nova saída
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const driver = document.getElementById('driver-name').value;
        const store = document.getElementById('store-name').value;
        let amount = document.getElementById('expense-amount').value;
        const received = document.getElementById('received-amount').value;
        const date = document.getElementById('expense-date').value;
        const weight = document.getElementById('expense-weight').value;
        const nfs = document.getElementById('expense-nfs').value;

        // 🔒 Regras fixas no submit
        if (driver === "Weverton" || driver === "Alexandre") {
            amount = 160;
        } else if (driver === "Flavio") {
            amount = 150;
        } else if (driver === "Marcos" || driver === "Alex" || driver === "Leandro") {
            amount = 0;
        }

        const profit = (received - amount).toFixed(2);

        const expense = { driver, store, amount, received, profit, date, weight, nfs };
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));

        if (filterStartDate && filterEndDate) {
            const today = new Date().toISOString().split('T')[0];
            filterStartDate.value = today;
            filterEndDate.value = today;
            applyFilters();
        }
    });

    // Remover saída
    window.removeExpense = (index) => {
        const password = prompt("2702..Digite a senha para confirmar a remoção:");
        const correctPassword = "";
        if (password === correctPassword) {
            const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            expenses.splice(index, 1);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            if (filterStartDate && filterEndDate) {
                const today = new Date().toISOString().split('T')[0];
                filterStartDate.value = today;
                filterEndDate.value = today;
                applyFilters();
            }
        } else {
            alert("Senha incorreta! A saída não foi removida.");
        }
    };

    const applyFilters = () => {
        const startDate = filterStartDate.value;
        const endDate = filterEndDate.value;
        const driver = filterDriver.value;
        const store = filterStore.value;
        loadExpenses(startDate, endDate, driver, store);
    };

    filterStartDate.addEventListener('change', applyFilters);
    filterEndDate.addEventListener('change', applyFilters);
    filterDriver.addEventListener('change', applyFilters);
    filterStore.addEventListener('change', applyFilters);

    // Carregar saídas do dia ao abrir
    const today = new Date().toISOString().split('T')[0];
    filterStartDate.value = today;
    filterEndDate.value = today;
    applyFilters();
});
