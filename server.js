
const express = require("express");
const cors = require("cors");
const fs = require("fs");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY; // 替换为你的API密钥

// 读取记忆
function loadMemory() {
  try {
    const data = fs.readFileSync("memory.json", "utf8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 保存记忆
function saveMemory(memory) {
  fs.writeFileSync("memory.json", JSON.stringify(memory, null, 2));
}

app.post("/api", async (req, res) => {
  const input = req.body.input;

  // 读取历史
  const memory = loadMemory();

  // 获取最后一次训练
  const lastRecord = memory[memory.length - 1];

  let historyText = "无历史记录";

  if (lastRecord) {
    historyText = `
上一次用户输入：
${lastRecord.input}

上一次训练计划：
${lastRecord.plan}
`;
  }

  try {
    const response = await fetch("https://api.apimart.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-5-mini",
        stream: false,
        messages: [
          {
            role: "user",
            content: `
你是OCR/Ninja训练教练。

用户当前输入：
${input}

历史训练记录：
${historyText}

请根据用户历史，
动态调整训练强度。

请输出：
【等级】
【分析】
【训练计划】
`
          }
        ]
      })
    });

    const data = await response.json();

    const result =
      data.choices?.[0]?.message?.content || "没有返回结果";

    // 保存到记忆
    memory.push({
      input: input,
      plan: result
    });

    saveMemory(memory);

    res.json({ result });

  } catch (err) {
    res.json({
      result: "错误：" + err.message
    });
  }
});

app.listen(3000, () => {
  console.log("服务器已启动：http://localhost:3000");
});