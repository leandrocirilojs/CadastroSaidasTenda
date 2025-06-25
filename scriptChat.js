/*function sendMessage() {
    const phoneNumber = document.getElementById('phoneNumber').value;
    const message = document.getElementById('message').value;
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
}

function autoFillMessage(message) {
    document.getElementById('message').value = message;
}

*/


        function loadContacts() {
            const chatList = document.getElementById("chat-list");
            chatList.innerHTML = "";
            
            const contacts = JSON.parse(localStorage.getItem("contacts")) || [];

            contacts.forEach((contact, index) => {
                const chatDiv = document.createElement("div");
                chatDiv.classList.add("chat");

                chatDiv.innerHTML = `<a href="https://wa.me/${contact.number}" target="_blank">
                    <img src="https://poloshoppingindaiatuba.com.br/assets/images/732e11da931f0081ab573c6bf3f38459.jpg" alt="User">
                    <div class="chat-info">
                        <h2>${contact.message.split(' ')[0]} ${index + 1}</h2>
                        <p>Número: ${contact.number}</p>
                        <p>Adicionado em: ${contact.date}</p>
                    </a></div>
                    <button onclick="removeContact(${index})" class="remove-button">X</button>
                    <span class="time">Agora</span>
                `;
                chatList.appendChild(chatDiv);
            });
        }

        function addContact() {
            const phoneInput = document.getElementById("phone-input");
            const messageInput = document.getElementById("message-input");
            const phoneNumber = phoneInput.value.trim();
            const message = messageInput.value.trim();

           /* const phoneRegex = /^[0-9]+$/;
            if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
                alert("Por favor, insira um número de telefone válido.");
                return;
            }*/

            const date = new Date().toLocaleString();

            const contacts = JSON.parse(localStorage.getItem("contacts")) || [];
            contacts.push({ number: phoneNumber, message: message, date: date });

            localStorage.setItem("contacts", JSON.stringify(contacts));

            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');

            phoneInput.value = "";
            messageInput.value = "";
            loadContacts();



    // Exibir notificação
    const notification = document.getElementById("notification");
    notification.style.display = "block";
    notification.innerText = "Contato adicionado!";
    
    setTimeout(() => {
        notification.style.display = "none";
    }, 4000); // Oculta a notificação após 2 segundos

                
        }

function removeContact(index) {
    const contacts = JSON.parse(localStorage.getItem("contacts")) || [];
    const confirmDelete = confirm("Tem certeza que deseja remover este contato?");
    
    if (confirmDelete) {
        contacts.splice(index, 1);
        localStorage.setItem("contacts", JSON.stringify(contacts));
        loadContacts();
    }
}

        function searchContacts() {
            const searchInput = document.getElementById("search-input").value.toLowerCase();
            const contacts = JSON.parse(localStorage.getItem("contacts")) || [];
            const chatList = document.getElementById("chat-list");
            chatList.innerHTML = ""; // Limpa a lista antes de carregar os contatos filtrados

            contacts.forEach((contact, index) => {
                if (contact.number.includes(searchInput) || contact.message.toLowerCase().includes(searchInput)) {
                    const chatDiv = document.createElement("div");
                    chatDiv.classList.add("chat");

                    chatDiv.innerHTML = `<a href="https://wa.me/${contact.number}" target="_blank">
                        <img src="https://poloshoppingindaiatuba.com.br/assets/images/732e11da931f0081ab573c6bf3f38459.jpg" alt="User">
                        <div class="chat-info">
                            <h2>${contact.message.split(' ')[0]} ${index + 1}</h2>
                            <p>Número: ${contact.number}</p>
                            <p>Adicionado em: ${contact.date}</p>
                        </a></div>
                        <button onclick="removeContact(${index})" class="remove-button">X</button>
                        <span class="time">Agora</span>
                    `;
                    chatList.appendChild(chatDiv);
                }
            });
        }

        window.onload = loadContacts;
    
