document.addEventListener('DOMContentLoaded', () => {
    const expenseForm = document.getElementById('expense-form');
    const expenseList = document.getElementById('expenses');
    const totalAmount = document.getElementById('total-amount');
    const totalProfit = document.getElementById('total-profit');
    const filterStartDate = document.getElementById('filter-start-date');
    const filterEndDate = document.getElementById('filter-end-date');
    const filterDriver = document.getElementById('filter-driver');
    const filterStore = document.getElementById('filter-store'); // Novo filtro
    const downloadPdfButton = document.getElementById('download-pdf');

    let filteredExpenses = [];  // Armazena as saídas filtradas para o PDF

    // Função para carregar e filtrar saídas
    const loadExpenses = (filterStartDateValue = null, filterEndDateValue = null, filterDriverValue = null, filterStoreValue = null) => {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenseList.innerHTML = '';  // Limpa a lista de saídas
        let total = 0;
        let totalProf = 0;

        filteredExpenses = [];  // Reinicia a lista filtrada

        // Itera sobre cada saída no LocalStorage
        expenses.forEach((expense, index) => {
            const dateExpense = new Date(expense.date);  // Converte a data da saída para o formato Date

            const startDateMatch = !filterStartDateValue || dateExpense >= new Date(filterStartDateValue);
            const endDateMatch = !filterEndDateValue || dateExpense <= new Date(filterEndDateValue);
            const driverMatch = !filterDriverValue || expense.driver === filterDriverValue;
            const storeMatch = !filterStoreValue || expense.store === filterStoreValue; // Verifica loja

            // Verifica se a saída corresponde aos filtros
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

                filteredExpenses.push(expense);  // Armazena a saída filtrada
            }
        });

        // Atualiza os totais
        totalAmount.textContent = total.toFixed(2);
        totalProfit.textContent = totalProf.toFixed(2);
    };

    // Adicionar nova saída
    expenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const driver = document.getElementById('driver-name').value;
        const store = document.getElementById('store-name').value;
        const amount = document.getElementById('expense-amount').value;
        const received = document.getElementById('received-amount').value;
        const date = document.getElementById('expense-date').value;
        const profit = (received - amount).toFixed(2);
        const weight = document.getElementById('expense-weight').value;
        const nfs = document.getElementById('expense-nfs').value;



        const expense = {
    driver,
    store,
    amount,
    received,
    profit,
    date,
    weight,
    nfs
};
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));

        //loadExpenses();  // Carrega a lista após adicionar uma nova saída
        if(filterStartDate && filterEndDate) {
    const today = new Date().toISOString().split('T')[0];
    filterStartDate.value = today;
    filterEndDate.value = today;
    applyFilters();
}

        // limpar todos os campos ^ expenseForm.reset();
    });

    // Remover saída
    window.removeExpense = (index) => {
        const password = prompt("2702..Digite a senha para confirmar a remoção:");
        const correctPassword = ""; // Defina sua senha aqui

        if (password === correctPassword) {
            const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
            expenses.splice(index, 1);  // Remove a saída da lista
            localStorage.setItem('expenses', JSON.stringify(expenses));  // Atualiza o LocalStorage
            //loadExpenses();
            if(filterStartDate && filterEndDate) {
    const today = new Date().toISOString().split('T')[0];
    filterStartDate.value = today;
    filterEndDate.value = today;
    applyFilters();
}

            
            // Recarrega a lista após a remoção
        } else {
            alert("Senha incorreta! A saída não foi removida.");
        }
    };

    // Função para aplicar os filtros de data, motorista e loja
    const applyFilters = () => {
        const startDate = filterStartDate.value;
        const endDate = filterEndDate.value;
        const driver = filterDriver.value;
        const store = filterStore.value; // Obtemos o valor do filtro de loja
        loadExpenses(startDate, endDate, driver, store);  // Aplica os filtros
    };

    // Eventos dos filtros de data, motorista e loja
    filterStartDate.addEventListener('change', applyFilters);
    filterEndDate.addEventListener('change', applyFilters);
    filterDriver.addEventListener('change', applyFilters);
    filterStore.addEventListener('change', applyFilters); // Adiciona o evento para o filtro de loja







    // Função para gerar o PDF
    downloadPdfButton.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configurações iniciais
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = margin;
    const lineHeight = 10;
    const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight);

    const addNewPage = () => {
        doc.addPage();
        y = margin;
    };

    // Cabeçalho
    doc.setFontSize(18);
    doc.text('Fechamento Tenda', margin, y);
    y += lineHeight * 2;

    // Período
    const startDate = filterStartDate.value || 'Não especificada';
    const endDate = filterEndDate.value || 'Não especificada';
    doc.setFontSize(14);
    doc.text(`Período: ${startDate} a ${endDate}`, margin, y);
    y += lineHeight * 2;

    // Título das colunas
    doc.setFontSize(12);
    doc.text('Motorista - Loja - Valor - Data - Peso (kg) - Qtd NFs', margin, y);
    y += lineHeight;

    // Totais
    let totalValue = 0;
    let totalWeight = 0;
    let totalNfs = 0;

    // Linhas dos dados
    filteredExpenses.forEach((expense) => {
        if (y + lineHeight > pageHeight - margin) {
            addNewPage();
        }

        const expenseText = `${expense.driver} - ${expense.store} - Valor: R$${expense.received} - Data: ${expense.date} - Peso: ${expense.weight || 0}kg - Nfs: ${expense.nfs || 0}`;
        doc.text(expenseText, margin, y);
        y += lineHeight;

        totalValue += parseFloat(expense.received || 0);
        totalWeight += parseFloat(expense.weight || 0);
        totalNfs += parseInt(expense.nfs || 0);
    });

    // Totais finais
    if (y + lineHeight * 5 > pageHeight - margin) {
        addNewPage();
    }

    doc.setFontSize(14);
    y += lineHeight;
    doc.text(`Quantidade de Saídas: ${filteredExpenses.length}`, margin, y);
    y += lineHeight;
    doc.text(`Peso Total: ${totalWeight.toFixed(2)} kg`, margin, y);
    y += lineHeight;
    doc.text(`Total de NFs: ${totalNfs}`, margin, y);
    y += lineHeight;
    doc.text(`Valor Total Recebido: R$ ${totalValue.toFixed(2)}`, margin, y);

    // Salvar
    doc.save('Relatorio_de_Saidas.pdf');
});






//whats
const generateWhatsAppMessage = () => {
    const startDate = document.getElementById('filter-start-date').value || 'Não especificada';
    const endDate = document.getElementById('filter-end-date').value || 'Não especificada';
    const driver = document.getElementById('filter-driver').value || 'Não especificado';
    const store = document.getElementById('filter-store').value || 'Não especificada';

    let totalValue = 0;
    let totalSaidas = filteredExpenses.length;

    // Agrupa as saídas por data
    const groupedByDate = {};

    filteredExpenses.forEach(expense => {
        totalValue += parseFloat(expense.received);

        if (!groupedByDate[expense.date]) {
            groupedByDate[expense.date] = [];
        }
        groupedByDate[expense.date].push(expense);
    });

    // Monta a mensagem no formato solicitado
    let message = `*Fechamento Tenda*\n\n`;
    message += `*${store}*\n\n`;
    message += `*${driver}*\n\n`;

    for (const [date, expensesOnDate] of Object.entries(groupedByDate)) {



   const [ano, mes, dia] = date.split('-');
const formattedDate = `${dia}/${mes}/${ano}`;

    message += `- Data -> ${formattedDate}\n-`;

        expensesOnDate.forEach((expense, index) => {
            message += ` Saída ${index + 1} -> Qtd Nfs -> ${expense.nfs || 'X'} - Peso: ${expense.weight}\n`;
        });

        message += `\n`; // Linha em branco entre datas
    }

    message += `Total de Saídas: ${totalSaidas} saída${totalSaidas > 1 ? 's' : ''}\n`;
    message += `Valor total: R$ ${totalValue.toFixed(2)}\n`;

    return message;
};

// Enviar via WhatsApp
document.getElementById('send-whatsapp').addEventListener('click', () => {
    // Verifica se há saídas filtradas
    if (filteredExpenses.length === 0) {
        alert("Nenhuma saída filtrada para enviar.");
        return;
    }

    // Gera a mensagem
    const message = generateWhatsAppMessage();

    // Cria a URL do WhatsApp
    const phoneNumber = "5513981335733"; // Substitua pelo número de telefone desejado
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    // Abre o WhatsApp em uma nova aba
    window.open(whatsappUrl, '_blank');
});



//excel

function exportToExcel() {
    // Use a variável filteredExpenses (já filtrada)
    const data = filteredExpenses.map(expense => [
        expense.driver,    // Motorista
        expense.store,     // Loja
        expense.amount,    // Valor Pago
        expense.received,  // Valor Recebido
        expense.profit,    // Lucro
        expense.date,      // Data
        expense.weight,    // Peso (kg)
        expense.nfs        // Qtd NFs
    ]);

    // Cálculos de totais
    const totalSaidas = filteredExpenses.length;
    const valorTotal = filteredExpenses.reduce((total, expense) => total + parseFloat(expense.received), 0);
    const pesoTotal = filteredExpenses.reduce((total, expense) => total + parseFloat(expense.weight || 0), 0);
    const totalNfs = filteredExpenses.reduce((total, expense) => total + parseInt(expense.nfs || 0), 0);

    // Adiciona uma linha em branco e linhas de totais
    data.push([]);
    data.push(['Total de Saídas', totalSaidas]);
    data.push(['Peso Total (kg)', pesoTotal.toFixed(2)]);
    data.push(['Total de NFs', totalNfs]);
    data.push(['Valor Total Recebido', `R$ ${valorTotal.toFixed(2)}`]);

    // Cabeçalho da planilha
    const ws = XLSX.utils.aoa_to_sheet([
        ['Motorista', 'Loja', 'Valor Pago', 'Valor Recebido', 'Lucro', 'Data', 'Peso (kg)', 'Qtd NFs'],
        ...data
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saídas');
    XLSX.writeFile(wb, 'Relatorio_Saidas.xlsx');
}

// Adicione o evento ao botão de exportar
document.getElementById('export-excel').addEventListener('click', exportToExcel);
// Carregar saídas do dia ao abrir a página
const today = new Date().toISOString().split('T')[0];
filterStartDate.value = today;
filterEndDate.value = today;
applyFilters();

    
});




// whats

// Variáveis de elementos com novos IDs
// Seleciona os elementos sem conflitos
const whatsappSchedulerSend = document.getElementById('whatsapp-scheduler-send');
const whatsappSchedulerMessage = document.getElementById('whatsapp-scheduler-message');
const whatsappSchedulerNumber = document.getElementById('whatsapp-scheduler-number');
const whatsappSchedulerButtons = document.querySelectorAll('.whatsapp-scheduler-message-button');

// Enviar mensagem para o WhatsApp
whatsappSchedulerSend.addEventListener('click', function () {
    const phoneNumber = whatsappSchedulerNumber.value.trim();
    const message = whatsappSchedulerMessage.value.trim();

    if (phoneNumber === "") {
        alert("Por favor, insira o número de WhatsApp.");
        return;
    }

    if (message === "") {
        alert("Por favor, selecione ou digite uma mensagem.");
        return;
    }

    const formattedPhoneNumber = phoneNumber.replace(/\D/g, ""); // Remove caracteres não numéricos
    const whatsappUrl = `https://wa.me/${formattedPhoneNumber}?text=${encodeURIComponent(message)}`;

    // Redireciona para o WhatsApp
    window.open(whatsappUrl, '_blank');
});

// Configura mensagens predefinidas ao clicar nos botões
whatsappSchedulerButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        const message = button.getAttribute('data-message');
        whatsappSchedulerMessage.value = message;
    });
});
