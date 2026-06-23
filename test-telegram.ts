const botToken = '8850602377:AAHXNRlRxFtZrfk3ouYowEozt0xr0dGrw_8';
async function test() {
  const updatesResponse = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);
  const updatesData = await updatesResponse.json();
  console.log("Updates:", JSON.stringify(updatesData, null, 2));

  let targetChatId = null;
  if (updatesData.ok && updatesData.result.length > 0) {
      targetChatId = updatesData.result[0].message?.chat?.id || updatesData.result[0].my_chat_member?.chat?.id;
  }
  console.log("targetChatId:", targetChatId);

  if (targetChatId) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: "test",
          parse_mode: 'HTML'
        }),
      });

      const data = await response.json();
      console.log("SendMessage Response:", JSON.stringify(data, null, 2));
  }
}
test();
