#!/usr/bin/env node

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve, join } from "path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MODEL = "claude-opus-4-6";
const MAX_TOKENS = 16000;
const client = new Anthropic();

// ---------------------------------------------------------------------------
// Tools available to every agent
// ---------------------------------------------------------------------------
const TOOLS = [
  {
    name: "read_file",
    description:
      "Read the contents of a file at the given path. Returns the full text content.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Absolute or relative file path" },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Write content to a file, creating it if it doesn't exist or overwriting if it does.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path to write to" },
        content: { type: "string", description: "Content to write" },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description:
      "List files and directories at the given path. Returns names separated by newlines.",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path (defaults to '.')",
        },
        pattern: {
          type: "string",
          description: "Optional glob-style suffix filter, e.g. '.js'",
        },
      },
      required: [],
    },
  },
  {
    name: "run_command",
    description:
      "Execute a shell command and return its stdout. Stderr is included on failure.",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command to run" },
        cwd: {
          type: "string",
          description: "Working directory (defaults to process cwd)",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "search_files",
    description:
      "Search for a regex pattern across files in a directory. Returns matching lines with filenames and line numbers.",
    input_schema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Regex pattern to search for" },
        path: {
          type: "string",
          description: "Directory to search in (defaults to '.')",
        },
        file_pattern: {
          type: "string",
          description: "Only search files matching this suffix, e.g. '.ts'",
        },
      },
      required: ["pattern"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------
function executeTool(name, input) {
  switch (name) {
    case "read_file": {
      const p = resolve(input.path);
      if (!existsSync(p)) return `Error: file not found: ${p}`;
      return readFileSync(p, "utf-8");
    }
    case "write_file": {
      const p = resolve(input.path);
      writeFileSync(p, input.content, "utf-8");
      return `Wrote ${input.content.length} bytes to ${p}`;
    }
    case "list_files": {
      const dir = resolve(input.path || ".");
      if (!existsSync(dir)) return `Error: directory not found: ${dir}`;
      let entries = readdirSync(dir, { withFileTypes: true }).map((d) =>
        d.isDirectory() ? d.name + "/" : d.name
      );
      if (input.pattern) {
        entries = entries.filter((e) => e.endsWith(input.pattern));
      }
      return entries.join("\n") || "(empty directory)";
    }
    case "run_command": {
      try {
        return execSync(input.command, {
          cwd: input.cwd || process.cwd(),
          encoding: "utf-8",
          timeout: 30_000,
          stdio: ["pipe", "pipe", "pipe"],
        });
      } catch (err) {
        return `Exit code ${err.status}\nstdout: ${err.stdout}\nstderr: ${err.stderr}`;
      }
    }
    case "search_files": {
      const dir = resolve(input.path || ".");
      const regex = new RegExp(input.pattern, "i");
      const results = [];

      function walk(d) {
        for (const entry of readdirSync(d, { withFileTypes: true })) {
          const full = join(d, entry.name);
          if (entry.name === "node_modules" || entry.name.startsWith("."))
            continue;
          if (entry.isDirectory()) {
            walk(full);
          } else {
            if (
              input.file_pattern &&
              !entry.name.endsWith(input.file_pattern)
            )
              continue;
            try {
              const lines = readFileSync(full, "utf-8").split("\n");
              lines.forEach((line, i) => {
                if (regex.test(line)) {
                  results.push(`${full}:${i + 1}: ${line.trim()}`);
                }
              });
            } catch {
              // skip binary / unreadable files
            }
          }
        }
      }

      walk(dir);
      return results.join("\n") || "No matches found.";
    }
    default:
      return `Error: unknown tool "${name}"`;
  }
}

// ---------------------------------------------------------------------------
// API call with retry on rate-limit (429) errors
// ---------------------------------------------------------------------------
async function callWithRetry(params, tag = "", maxRetries = 5) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      if (status === 429 && attempt < maxRetries) {
        const retryAfter = err?.headers?.["retry-after"];
        const wait = retryAfter
          ? Number(retryAfter) * 1000
          : Math.min(2000 * 2 ** attempt, 60000);
        if (tag) console.log(`${tag}   rate-limited, retrying in ${(wait / 1000).toFixed(1)}s...`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Agentic loop — run a single prompt to completion with tool use
// ---------------------------------------------------------------------------
async function runAgent(prompt, { systemPrompt, label } = {}) {
  const tag = label ? `[${label}]` : "";
  if (tag) console.log(`${tag} Starting...`);

  const messages = [{ role: "user", content: prompt }];
  const system = systemPrompt || "You are a helpful assistant with access to file and command tools. Be concise.";

  let iterations = 0;
  const MAX_ITERATIONS = 20;

  while (iterations++ < MAX_ITERATIONS) {
    const response = await callWithRetry({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      tools: TOOLS,
      messages,
    }, tag);

    if (response.stop_reason === "end_turn" || response.stop_reason === "max_tokens") {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      if (tag) console.log(`${tag} Done.`);
      return text;
    }

    // Handle tool calls
    const toolBlocks = response.content.filter((b) => b.type === "tool_use");
    if (toolBlocks.length === 0) {
      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return text;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults = toolBlocks.map((block) => {
      if (tag)
        console.log(`${tag}   tool: ${block.name}(${JSON.stringify(block.input).slice(0, 80)})`);
      const result = executeTool(block.name, block.input);
      return {
        type: "tool_result",
        tool_use_id: block.id,
        content: typeof result === "string" ? result : JSON.stringify(result),
      };
    });

    messages.push({ role: "user", content: toolResults });
  }

  return "(max iterations reached)";
}

// ---------------------------------------------------------------------------
// Mode: parallel — run independent tasks concurrently
// ---------------------------------------------------------------------------
async function runParallel(tasks) {
  console.log(`\n=== PARALLEL MODE: ${tasks.length} tasks ===\n`);
  const settled = await Promise.allSettled(
    tasks.map((task, i) => runAgent(task, { label: `Task ${i + 1}` }))
  );

  console.log("\n=== RESULTS ===\n");
  settled.forEach((s, i) => {
    console.log(`--- Task ${i + 1} ---`);
    if (s.status === "fulfilled") {
      console.log(s.value);
    } else {
      console.log(`ERROR: ${s.reason?.message ?? s.reason}`);
    }
    console.log();
  });
  return settled.map((s) => (s.status === "fulfilled" ? s.value : `ERROR: ${s.reason?.message}`));
}

// ---------------------------------------------------------------------------
// Mode: chain — sequential pipeline, each step receives prior output
// ---------------------------------------------------------------------------
async function runChain(steps) {
  console.log(`\n=== CHAIN MODE: ${steps.length} steps ===\n`);
  let context = "";
  const results = [];

  for (let i = 0; i < steps.length; i++) {
    const prompt =
      context
        ? `Previous step output:\n<previous>\n${context}\n</previous>\n\nNow do: ${steps[i]}`
        : steps[i];

    const result = await runAgent(prompt, { label: `Step ${i + 1}` });
    results.push(result);
    context = result;
  }

  console.log("\n=== FINAL OUTPUT ===\n");
  console.log(results.at(-1));
  return results;
}

// ---------------------------------------------------------------------------
// Mode: workflow — DAG with depends_on fields
// ---------------------------------------------------------------------------
async function runWorkflow(workflow) {
  const { steps } = workflow;
  const stepNames = Object.keys(steps);
  console.log(
    `\n=== WORKFLOW MODE: "${workflow.name}" (${stepNames.length} steps) ===\n`
  );

  const completed = new Map(); // stepName -> result
  const inProgress = new Map(); // stepName -> Promise<string>

  function canStart(name) {
    const deps = steps[name].depends_on || [];
    return deps.every((d) => completed.has(d));
  }

  function buildPrompt(name) {
    const step = steps[name];
    const deps = step.depends_on || [];
    if (deps.length === 0) return step.prompt;

    const depContext = deps
      .map((d) => `[${d}] output:\n${completed.get(d)}`)
      .join("\n\n");

    return `Here are the results from prior steps:\n<context>\n${depContext}\n</context>\n\n${step.prompt}`;
  }

  // Process until all steps complete
  while (completed.size < stepNames.length) {
    // Launch any step whose dependencies are satisfied and isn't already running
    const launchable = stepNames.filter(
      (n) => !completed.has(n) && !inProgress.has(n) && canStart(n)
    );

    if (launchable.length === 0 && inProgress.size === 0) {
      console.error("Deadlock: unresolvable dependencies");
      break;
    }

    for (const name of launchable) {
      const promise = runAgent(buildPrompt(name), { label: name });
      inProgress.set(name, promise);
    }

    // Wait for at least one to finish
    const racing = [...inProgress.entries()].map(([name, p]) =>
      p.then((result) => ({ name, result }))
    );
    const finished = await Promise.race(racing);
    completed.set(finished.name, finished.result);
    inProgress.delete(finished.name);
  }

  console.log("\n=== WORKFLOW RESULTS ===\n");
  for (const name of stepNames) {
    console.log(`--- ${name} ---`);
    console.log(completed.get(name));
    console.log();
  }
  return Object.fromEntries(completed);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function printUsage() {
  console.log(`
parallel-agent.mjs — Run Claude tasks in parallel, chained, or as a DAG workflow

Usage:
  node parallel-agent.mjs parallel "task1" | "task2" | "task3"
  node parallel-agent.mjs parallel tasks.json
  node parallel-agent.mjs chain    "step1" -> "step2" -> "step3"
  node parallel-agent.mjs workflow workflow.json

Modes:
  parallel   Run tasks concurrently. Provide pipe-separated inline tasks
             or a JSON file containing an array of prompt strings.
  chain      Run steps sequentially; each step receives the prior step's
             output as context. Separate steps with " -> ".
  workflow   Run a DAG defined in a JSON file. Each step has a "prompt"
             and "depends_on" array naming prerequisite step keys.

Environment:
  ANTHROPIC_API_KEY   Required. Your Anthropic API key.

Examples:
  node parallel-agent.mjs parallel "Summarize README.md" | "List all TODO comments"
  node parallel-agent.mjs chain "List files in src/" -> "Pick the largest file and summarize it"
  node parallel-agent.mjs workflow sample-workflow.json
`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    printUsage();
    process.exit(1);
  }

  const mode = args[0];
  const rest = args.slice(1).join(" ");

  switch (mode) {
    case "parallel": {
      let tasks;
      // Check if it's a JSON file
      if (rest.endsWith(".json") && existsSync(resolve(rest))) {
        tasks = JSON.parse(readFileSync(resolve(rest), "utf-8"));
        if (!Array.isArray(tasks)) {
          console.error("JSON file must contain an array of prompt strings.");
          process.exit(1);
        }
      } else {
        tasks = rest.split("|").map((t) => t.trim()).filter(Boolean);
      }
      if (tasks.length === 0) {
        console.error("No tasks provided.");
        process.exit(1);
      }
      await runParallel(tasks);
      break;
    }
    case "chain": {
      const steps = rest.split("->").map((s) => s.trim()).filter(Boolean);
      if (steps.length === 0) {
        console.error("No steps provided.");
        process.exit(1);
      }
      await runChain(steps);
      break;
    }
    case "workflow": {
      const filePath = resolve(rest.trim());
      if (!existsSync(filePath)) {
        console.error(`Workflow file not found: ${filePath}`);
        process.exit(1);
      }
      const workflow = JSON.parse(readFileSync(filePath, "utf-8"));
      if (!workflow.steps) {
        console.error('Workflow JSON must have a "steps" object.');
        process.exit(1);
      }
      await runWorkflow(workflow);
      break;
    }
    default:
      console.error(`Unknown mode: "${mode}". Use parallel, chain, or workflow.`);
      printUsage();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
