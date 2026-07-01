import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  emitRulesArgParseError,
  handleRulesApiError,
  parseRulesFlagsAndScope,
  rulesItemPath
} from "./chunk-AHS6XAT2.js";
import "./chunk-LM7QG25J.js";
import "./chunk-U5FVI3MF.js";
import {
  validateJsonOutput
} from "./chunk-XPKWKPWA.js";
import {
  rulesInspectSubcommand
} from "./chunk-SGPBULVT.js";
import {
  AGENT_REASON
} from "./chunk-QH7WYDEP.js";
import "./chunk-2LA6R76V.js";
import "./chunk-URENS2ZN.js";
import {
  buildCommandWithGlobalFlags,
  outputAgentError
} from "./chunk-X5UROEGN.js";
import "./chunk-Q77ALSXR.js";
import {
  getFlagsSpecification,
  parseArguments,
  printError
} from "./chunk-MYWLF3BZ.js";
import {
  isAPIError,
  packageName
} from "./chunk-LN6B7ZI3.js";
import "./chunk-P4QNYOFB.js";
import "./chunk-2RVK3DDN.js";
import {
  output_manager_default
} from "./chunk-Z5SBJH6L.js";
import "./chunk-GGP5R3FU.js";
import "./chunk-S7KYDPEM.js";
import "./chunk-TZ2YI2VH.js";

// src/commands/alerts/rules/rule-inspect.ts
async function ruleInspect(client, argv) {
  let parsedArgs;
  try {
    parsedArgs = parseArguments(
      argv,
      getFlagsSpecification(rulesInspectSubcommand.options)
    );
  } catch (e) {
    emitRulesArgParseError(
      client,
      e,
      "alerts rules inspect <ruleId> --project <name-or-id>"
    );
    printError(e);
    return 1;
  }
  const ruleId = parsedArgs.args[0];
  const fr = validateJsonOutput(parsedArgs.flags);
  if (!fr.valid) {
    outputAgentError(
      client,
      {
        status: "error",
        reason: AGENT_REASON.INVALID_ARGUMENTS,
        message: fr.error
      },
      1
    );
    output_manager_default.error(fr.error);
    return 1;
  }
  if (!ruleId) {
    outputAgentError(
      client,
      {
        status: "error",
        reason: AGENT_REASON.MISSING_ARGUMENTS,
        message: `Missing rule id. Example: ${packageName} alerts rules inspect <ruleId>`,
        next: [
          {
            command: buildCommandWithGlobalFlags(
              client.argv,
              "alerts rules inspect <ruleId>"
            ),
            when: "Replace <ruleId> with an id from `alerts rules ls`"
          },
          {
            command: buildCommandWithGlobalFlags(
              client.argv,
              "alerts rules ls"
            ),
            when: "List rule ids in the current scope"
          }
        ]
      },
      1
    );
    output_manager_default.error("Usage: `vercel alerts rules inspect <ruleId>`");
    return 1;
  }
  const scope = await parseRulesFlagsAndScope(
    client,
    {
      "--project": parsedArgs.flags["--project"],
      "--all": parsedArgs.flags["--all"]
    },
    fr.jsonOutput
  );
  if (typeof scope === "number") {
    return scope;
  }
  const path = rulesItemPath(scope, ruleId);
  output_manager_default.spinner("Fetching alert rule...");
  try {
    const rule = await client.fetch(path);
    if (fr.jsonOutput) {
      client.stdout.write(`${JSON.stringify({ rule }, null, 2)}
`);
    } else {
      client.stdout.write(`${JSON.stringify(rule, null, 2)}
`);
    }
    return 0;
  } catch (err) {
    if (isAPIError(err)) {
      return handleRulesApiError(client, err, fr.jsonOutput);
    }
    throw err;
  } finally {
    output_manager_default.stopSpinner();
  }
}
export {
  ruleInspect as default
};
