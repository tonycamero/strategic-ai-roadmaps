import OpenAI from 'openai';
import 'dotenv/config';

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const assistantId =
    process.env.OPENAI_TRUSTAGENT_ASSISTANT_ID || 'asst_xxx_replace_me';

  if (assistantId === 'asst_xxx_replace_me') {
    console.error('Error: OPENAI_TRUSTAGENT_ASSISTANT_ID not set in .env');
    console.error('Please set this environment variable to your OpenAI Assistant ID');
    process.exit(1);
  }

  console.error(`Fetching assistant: ${assistantId}`);

  const asst = await client.beta.assistants.retrieve(assistantId);

  const snapshot = {
    id: asst.id,
    name: asst.name,
    model: asst.model,
    description: asst.description,
    instructions: asst.instructions,
    tools: asst.tools,
    response_format: asst.response_format,
    temperature: (asst as any).temperature, // if present
    top_p: (asst as any).top_p,
    metadata: asst.metadata,
    created_at: asst.created_at,
  };

  console.log(JSON.stringify(snapshot, null, 2));
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
