import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to proxy Telegram message
  app.post('/api/telegram', async (req, res) => {
    try {
      const { text } = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN || '8850602377:AAHXNRlRxFtZrfk3ouYowEozt0xr0dGrw_8'; // from user prompt
      const chatId = process.env.TELEGRAM_CHAT_ID; // We need a chat ID as well.
      
      if (!text) {
         return res.status(400).json({ error: 'Text is required' });
      }
      
      // Wait, if no chat ID is provided, getting the chat ID from the bot is a bit tricky
      // Usually you just send message to a known chat ID. Let's ask the user to configure it via process.env or just hardcode if they provided one. Wait, they didn't provide a chat ID.
      // Wait, I can try to find a recent message to the bot using getUpdates if TELEGRAM_CHAT_ID is missing. Or just use the token to send to a hardcoded chat if I can find it.
      // But typically we rely on TELEGRAM_CHAT_ID... Let's use getUpdates to dynamically fetch the chat ID of the bot author if it's missing, but it's risky if the bot isn't initialized by the user first.
      
      let targetChatId = chatId;
      
      // If the user provided a t.me link or bot name instead of a numeric ID, ignore it so we can try to fetch it dynamically
      if (targetChatId && (targetChatId.includes('t.me') || targetChatId.includes('bot'))) {
         targetChatId = undefined;
      }

      if (!targetChatId) {
        const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
        const updatesData = await updatesResponse.json();
        if (updatesData.ok && updatesData.result.length > 0) {
           // Get the chat ID from the most recent interaction
           const lastUpdate = updatesData.result[updatesData.result.length - 1];
           targetChatId = lastUpdate.message?.chat?.id || lastUpdate.my_chat_member?.chat?.id || lastUpdate.callback_query?.message?.chat?.id;
        }
      }

      if (!targetChatId) {
        return res.status(500).json({ error: 'Erro de Configuração: O Chat ID do Telegram não foi encontrado. Para receber mensagens, você precisa enviar um "Oi" para o seu bot (@Botfocobot) primeiro.' });
      }

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text,
          parse_mode: 'HTML'
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        console.error('Telegram API error:', data);
        return res.status(500).json({ error: `Falha na API do Telegram: ${data.description}` });
      }

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
