import "dotenv/config";

import { SMSChannel, TAC, TACConfig, TACServer, VoiceChannel } from "twilio-agent-connect";
import { handleAgentMessage } from "./agents/field-shift-agent.js";


const tac = await TAC.create({ config: TACConfig.fromEnv() });

tac.registerChannel(new VoiceChannel(tac, { memoryMode: "always" }));
tac.registerChannel(new SMSChannel(tac, { memoryMode: "always" }));

tac.onMessageReady(async ({ conversationId, message, memory, session, channel }) => {
  console.log(`[${channel}] ${message}`);
  const response = await fetch("https://your-n8n-instance.com/webhook/field-shift", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      message,
      memory,       // Durable identity traits from Twilio
      session,      // Twilio session metadata
      channel,
    }),
  });

  const data = await response.json();
  return data.reply;
});

await new TACServer(tac, {
  host: process.env.TWILIO_SERVER_HOST || "0.0.0.0",
  port: Number.parseInt(process.env.TWILIO_SERVER_PORT || process.env.PORT || "8000", 10),
}).start();
