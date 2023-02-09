import ErrorHandler from './error';
import API from './api';
import TemplateEngine from './templateEngine';

const modal = document.querySelector('.modal');
const form = modal.querySelector('.modal__form');
const input = form.querySelector('.modal-form__input');
const chat = document.querySelector('.chat-widget');
const messagesContainer = chat.querySelector('.chat-widget__messages-container');
const messages = chat.querySelector('.chat-widget__messages');
const chatInput = chat.querySelector('.chat-widget__input');
const loading = document.querySelector('.status-loading');
const errorHandler = new ErrorHandler(input);
const baseUrl = 'simple-chat-2021.herokuapp.com';
const api = new API(`https://${baseUrl}`, modal, input, loading);

api.connection();

form.onsubmit = (event) => {
  event.preventDefault();
  const { value } = input;

  if (!value || !value.trim()) {
    input.value = '';
    errorHandler.outputError('Ошибка! Введено пустое значение.');
    return;
  }

  const ownName = value.trim();
  input.value = '';

  (async () => {
    const response = await api.add({ name: ownName });
    if (response) {
      const ws = new WebSocket(`wss://${baseUrl}`);

      chatInput.addEventListener('keyup', (chatInputEvent) => {
        if (chatInputEvent.key === 'Enter') {
          const { value: msg } = chatInput;
          if (!msg || !msg.trim()) {
            chatInput.value = '';
            return;
          }
          const newMessage = JSON.stringify({
            author: ownName,
            message: msg.trim(),
          });
          ws.send(newMessage);
          chatInput.value = '';
        }
      });

      document.onclick = (documentEvent) => {
        if (!documentEvent.target.closest('.chat-widget')) {
          chatInput.value = '';
        }
      };

      const usersContainer = document.querySelector('.users-list-container');
      const usersList = usersContainer.querySelector('.users-list');

      ws.addEventListener('message', (wsMsgEvent) => {
        const data = JSON.parse(wsMsgEvent.data);
        if (Array.isArray(data)) {
          usersList.textContent = '';
          usersList.insertAdjacentHTML('beforeend', TemplateEngine.getUsersHTML(data, ownName));
        } else if (typeof data === 'object') {
          TemplateEngine.addMessage(messages, data, ownName, messagesContainer);
        }
      });

      ws.addEventListener('close', () => {
        chatInput.disabled = true;
        chatInput.placeholder = 'Работа сервера приостановлена';
      });

      ws.addEventListener('open', () => {
        chatInput.disabled = false;
        chatInput.placeholder = 'Введите ваше сообщение';
      });

      modal.classList.remove('active');

      setInterval(() => {
        usersContainer.classList.add('active');
      }, 1000);

      chat.classList.add('active');
      chatInput.value = '';
      chatInput.focus();
    }
  })();
};
