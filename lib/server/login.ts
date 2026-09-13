import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { HOME } from "./env";
import { getAuthStatus } from "./authStatus";

// `/login` as a chat message doesn't work — confirmed directly: headless `-p` mode
// rejects it ("/login isn't available in this environment"), same restriction as
// /model, /effort, /mcp. `claude auth login` is the CLI's own scriptable command
// for this instead — plain text prompts/stdin, no stream-json protocol involved.
export function createLoginSession(send: (obj: unknown) => void) {
  let loginChild: ChildProcessWithoutNullStreams | null = null;

  function start(): void {
    if (loginChild && !loginChild.killed) loginChild.kill();
    loginChild = spawn("claude", ["auth", "login", "--claudeai"], {
      cwd: HOME,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let buf = "";
    const onOutput = (chunk: Buffer) => {
      buf += chunk.toString("utf8");
      const urlMatch = buf.match(/https:\/\/\S+/);
      if (urlMatch) send({ type: "login_url", url: urlMatch[0] });
    };
    loginChild.stdout.on("data", onOutput);
    loginChild.stderr.on("data", onOutput);
    loginChild.on("close", (code) => {
      send({ type: "login_result", success: code === 0, authStatus: getAuthStatus(), message: code === 0 ? null : buf.slice(-300) });
    });
  }

  function submitCode(code: string): void {
    if (loginChild && !loginChild.stdin.destroyed) {
      loginChild.stdin.write(code + "\n");
    }
  }

  function cleanup(): void {
    if (loginChild && !loginChild.killed) loginChild.kill();
  }

  return { start, submitCode, cleanup };
}
